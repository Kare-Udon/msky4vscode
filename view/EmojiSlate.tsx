import React, { useMemo, useState, useCallback } from 'react';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps } from 'slate-react';
import { createEditor, Descendant } from 'slate';
import { ReactEditor } from 'slate-react';
import { BaseEditor } from 'slate';
import * as styles from './view.style';
import Linkify from "linkify-react";
import 'linkify-plugin-hashtag';
import 'linkify-plugin-mention';
import { Opts as LinkifyOptions } from 'linkifyjs';

// Define custom element types
type CustomElement = { type: 'paragraph'; children: CustomText[] };
type CustomText = { text: string; emoji?: string };

// Extend Slate types
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Custom editor
const withLinks = (editor: ReactEditor) => {
  const { insertText } = editor;

  editor.insertText = (text) => {
    insertText(text);
  };

  return editor;
};

interface EmojiSlateProps {
  isReadOnly: boolean;
  initialValue: Descendant[];
  loggedInAccount: any;
}

const EmojiSlate: React.FC<EmojiSlateProps> = ({ isReadOnly, initialValue, loggedInAccount }) => {
  const [value, setValue] = useState<Descendant[]>(initialValue);
  const editor = useMemo(() => withLinks(withReact(createEditor())), []);

  const linkifyOptions: LinkifyOptions = {
    className: styles.link,
    formatHref: {
      hashtag: (href) => `https://${loggedInAccount?.host}/tags/${href.replace(/^\#/, '')}`,
      mention: (href) => `https://${loggedInAccount?.host}${href.replace(/^\//, '/@')}`,
    },
    nl2br: true,
    validate: {
      url: (value) => /^https?:\/\//.test(value),
      email: () => false,
    },
  };

  // Render element
  const Element: React.FC<RenderElementProps> = ({ attributes, children, element }) => {
    return <span {...attributes}>{children}</span>;
  };

  // Render leaf node
  const Leaf: React.FC<RenderLeafProps> = ({ attributes, children, leaf }) => {
    if (leaf.emoji) {
      return (
        <span {...attributes} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
          <img
            src={leaf.emoji}
            alt="emoji"
            style={{ height: '1.5em', width: '1.5em', marginLeft: '0.2em', marginRight: '0.2em' }}
          />
          {children}
        </span>
      );
    }
    return (
      <span {...attributes}>
        <Linkify options={linkifyOptions}>{leaf.text}</Linkify>
      </span>
    );
  };

  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);

  return (
    <Slate editor={editor} initialValue={value} onChange={setValue}>
      <Editable
        readOnly={isReadOnly}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
      />
    </Slate>
  );
};

export default EmojiSlate;
