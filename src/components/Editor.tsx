"use client";
import { FC, useCallback, useEffect, useRef, useState } from "react";

interface EditorProps {
  communityId: string;
}
import TextareaAutosize from "react-textarea-autosize";
import { useForm } from "react-hook-form";
import { PostCreationRequest, PostValidator } from "@/lib/validators/post";
import { zodResolver } from "@hookform/resolvers/zod";

import type EditorJS from "@editorjs/editorjs";
import { uploadFiles } from "@/lib/uploadthing";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";

import { z } from "zod";

import "@/styles/editor.css";

type FormData = z.infer<typeof PostValidator>;

const Editor: FC<EditorProps> = ({ communityId }) => {
  // type safety for form using generic type argument PostCreationRequest (see src/lib/validators/post.ts)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(PostValidator),
    defaultValues: {
      communityId,
      title: "",
      content: null,
    },
  });

  const ref = useRef<EditorJS>();
  // Initializing the editor but differing the loading dynamically
  const [isMounted, setIsMounted] = useState<boolean>();
  const _titleRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  //* -------------------------> TANSTACK QUERY;  WE ARE SUBMITTING DATA SO WE WILL USE USE MUTATION HOOK TO DO THIS --------------------------> */

  const { mutate: createPost } = useMutation({
    mutationFn: async ({
      title,
      content,
      communityId,
    }: PostCreationRequest) => {
      const payload: PostCreationRequest = {
        title,
        content,
        communityId,
      };

      // HTTP POST request to a  API endpoint (/api/community/post/create). The payload object is sent as the request body. The response from the API call is stored in the data variable, and it is returned from the mutationFn function

      const { data } = await axios.post(`/api/community/post/create`, payload);
      return data;
    },

    // handling error

    onError: () => {
      return toast({
        title: "Something went wrong",
        description: "Your post was not published. Please try again.",
        variant: "destructive",
      });
    },

    // handling success with push to the community page

    onSuccess: () => {
      // cb/myCommunity/publish to cb/myCommunity

      const newPathname = pathname.split("/").slice(0, -1).join("/");

      router.push(newPathname);
      router.refresh();

      return toast({
        title: "Your post has been published",
        description: "You can view it in the community page.",
      });
    },
  });

  const initializeEditor = useCallback(async () => {
    const EditorJS = (await import("@editorjs/editorjs")).default;
    const Header = (await import("@editorjs/header")).default;
    const List = (await import("@editorjs/list")).default;
    const Table = (await import("@editorjs/table")).default;
    const Embed = (await import("@editorjs/embed")).default;
    const ImageTool = (await import("@editorjs/image")).default;
    const LinkTool = (await import("@editorjs/link")).default;
    const InlineCode = (await import("@editorjs/inline-code")).default;
    const Code = (await import("@editorjs/code")).default;
    const Quote = (await import("@editorjs/quote")).default;
    const Marker = (await import("@editorjs/marker")).default;
    const CheckList = (await import("@editorjs/checklist")).default;
    const CodeBox = (await import("@bomdi/codebox")).default;
    const LinkAutocomplete = (await import("@editorjs/link-autocomplete"))
      .default;

    if (!ref.current) {
      const editor = new EditorJS({
        holder: "editor", // div to which the editor is trying to mount to
        onReady() {
          ref.current = editor;
        },
        placeholder: "Type something awesome! .. ",
        inlineToolbar: true,
        data: { blocks: [] },
        tools: {
          header: Header,
          linkTool: {
            class: LinkTool,
            config: {
              endpoint: "/api/link",
            },
          },
          link: {
            class: LinkAutocomplete,
            config: {
              endpoint: "https://techcrunch.com/",
              queryParam: "search",
            },
          },

          image: {
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const [res] = await uploadFiles([file], "imageUploader");

                  return {
                    success: 1,
                    file: {
                      url: res.fileUrl,
                    },
                  };
                },
              },
            },
          },
          list: List,
          table: Table,
          embed: Embed,
          inlineCode: InlineCode,
          codeBox: {
            class: CodeBox,
            config: {
              themeURL:
                "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.18.1/build/styles/dracula.min.css", // Optional
              themeName: "atom-one-dark", // Optional
              useDefaultTheme: "light", // Optional. This also determines the background color of the language select drop-down
            },
          },
          code: Code,
          quote: Quote,
          marker: Marker,
          checklist: CheckList,
        },
      });
    }
  }, []);

  // error handling for react-hook-form

  useEffect(() => {
    if (Object.keys(errors).length) {
      for (const [_key, value] of Object.entries(errors)) {
        toast({
          title: "Something went wrong",
          description: (value as { message: string }).message,
          variant: "destructive",
        });
      }
    }
  }, [errors]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await initializeEditor();

      setTimeout(() => {
        // set focus to title
        _titleRef?.current?.focus();
      }, 0);
    };

    if (isMounted) {
      init();

      // cleanup function to destroy the editor instance when the component unmounts (see https://editorjs.io/saving-data) (see https://reactjs.org/docs/hooks-effect.html#effects-with-cleanup)
      return () => {
        ref.current?.destroy();
        ref.current = undefined;
      };
    }
  }, [isMounted, initializeEditor]);

  // handling the form submission
  async function onSubmit(data: FormData) {
    // saving the data from the editor content to the data object

    const blocks = await ref.current?.save();

    const payload: PostCreationRequest = {
      title: data.title,
      content: blocks,
      communityId,
    };

    createPost(payload);
  }

  if (!isMounted) return null;

  const { ref: titleRef, ...rest } = register("title"); // register the title field with react-hook-form and get the ref to the input element (see https://react-hook-form.com/api/useform/register) and spread the rest of the props to the input element.

  return (
    <div className="w-full p-4 bg-[#1B1F23] rounded-lg border border-zinc-500">
      <form
        id="community-post-form"
        className="w-fit"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="prose prose-stone dark:prose-invert">
          <TextareaAutosize
            ref={e => {
              titleRef(e);

              // @ts-ignore
              _titleRef.current = e;
            }}
            {...rest}
            placeholder="Title"
            className="w-full resize-none appearance-none overflow-hidden bg-transparent text-5xl font-bold focus:outline-none text-gray-400"
          />

          {/* shell to mount the editor */}

          <div id="editor" className="min-h-[500px] text-zinc-300" />
        </div>
      </form>
    </div>
  );
};

export default Editor;
