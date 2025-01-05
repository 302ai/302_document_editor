import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  MessageSquarePlus,
  Minus,
  Table,
  Text,
  TextQuote,
  Twitter,
  Youtube,
} from "lucide-react";
import { createSuggestionItems } from "novel/extensions";
import { Command, renderItems } from "novel/extensions";
import { uploadFn } from "./image-upload";
import { PiMagicWandFill } from "react-icons/pi";
import { TbChartAreaLine } from "react-icons/tb";
import { FcFlowChart } from "react-icons/fc";

export const suggestionItems = createSuggestionItems([
  {
    title: "AI",
    description: "Just start typing with plain text.",
    searchTerms: ['a'],
    icon: <PiMagicWandFill className="text-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
    },
  },
  {
    title: "Generate illustrations",
    description: "Just start typing with plain text.",
    searchTerms: ['il'],
    icon: <TbChartAreaLine className="text-[18px]" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
    },
  },
  {
    title: "FlowChart",
    description: "flow chart",
    searchTerms: ["f"],
    icon: <FcFlowChart className="text-slate-800" size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
    },
  },
  {
    title: "Text",
    description: "Just start typing with plain text.",
    searchTerms: ["c", "paragraph"],
    icon: <Text size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
    },
  },
  {
    title: "Heading 1",
    description: "Big section heading.",
    searchTerms: ['t',],
    icon: <Heading1 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading.",
    searchTerms: ['tt',],
    icon: <Heading2 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading.",
    searchTerms: ['ttt',],
    icon: <Heading3 size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a list with numbering.",
    searchTerms: ["o"],
    icon: <ListOrdered size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list.",
    searchTerms: ["b"],
    icon: <List size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Image",
    description: "Upload an image from your computer.",
    searchTerms: ["i"],
    icon: <ImageIcon size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        if (input.files?.length) {
          const file = input.files[0];
          const pos = editor.view.state.selection.from;
          uploadFn(file, editor.view, pos);
        }
      };
      input.click();
    },
  },
  {
    title: "Quote",
    description: "Capture a quote.",
    searchTerms: ["r"],
    icon: <TextQuote size={18} />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").toggleBlockquote().run(),
  },
  {
    title: "Code",
    description: "Capture a code snippet.",
    searchTerms: ["e"],
    icon: <Code size={18} />,
    command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Insert a horizontal divider.",
    searchTerms: ["d"],
    icon: <Minus size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Table",
    description: "Add a table view to organize data.",
    icon: <Table size={18} />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();

      setTimeout(() => {
        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;

        // Retrieve the parent node containing the table, usually a section of the document
        const depthToCheck = $from.depth;
        let tablePosition = null;

        for (let d = depthToCheck; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === 'table') {
            tablePosition = $from.before(d);
            break;
          }
        }
        if (tablePosition !== null) {
          // Ensure that the end position of the table has been calculated
          const tableNode = state.doc.nodeAt(tablePosition);
          const tableEndPos = tablePosition + (tableNode ? tableNode.nodeSize : 0);

          // Insert new paragraph and update cursor position
          editor.chain().insertContentAt(tableEndPos, {
            type: 'paragraph',  // Specify as paragraph node type
            content: null       // Empty content to make it a blank line
          }).setTextSelection(tableEndPos + 1).run();
        }
      }, 50);
    },
  },
  // {
  //   title: "Youtube",
  //   description: "Embed a Youtube video.",
  //   searchTerms: ["video", "youtube", "embed"],
  //   icon: <Youtube size={18} />,
  //   command: ({ editor, range }) => {
  //     const videoLink = prompt("Please enter Youtube Video Link");
  //     //From https://regexr.com/3dj5t
  //     const ytregex = new RegExp(
  //       /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/,
  //     );

  //     if (ytregex.test(videoLink)) {
  //       editor
  //         .chain()
  //         .focus()
  //         .deleteRange(range)
  //         .setYoutubeVideo({
  //           src: videoLink,
  //         })
  //         .run();
  //     } else {
  //       if (videoLink !== null) {
  //         alert("Please enter a correct Youtube Video Link");
  //       }
  //     }
  //   },
  // },
  // {
  //   title: "Twitter",
  //   description: "Embed a Tweet.",
  //   searchTerms: ["twitter", "embed"],
  //   icon: <Twitter size={18} />,
  //   command: ({ editor, range }) => {
  //     const tweetLink = prompt("Please enter Twitter Link");
  //     const tweetRegex = new RegExp(/^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]{1,15})(\/status\/(\d+))?(\/\S*)?$/);

  //     if (tweetRegex.test(tweetLink)) {
  //       editor
  //         .chain()
  //         .focus()
  //         .deleteRange(range)
  //         .setTweet({
  //           src: tweetLink,
  //         })
  //         .run();
  //     } else {
  //       if (tweetLink !== null) {
  //         alert("Please enter a correct Twitter Link");
  //       }
  //     }
  //   },
  // },
]);

export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
});
