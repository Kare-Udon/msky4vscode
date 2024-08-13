import { css } from '@emotion/css';
import styled from '@emotion/styled';
import { GridComponents } from "react-virtuoso";

export const formItem = css({
    margin: '10px 0',
});

export const formInput = css({
    width: '100%',
});

export const formDescription = css({
    fontSize: '85%',
    color: 'var(--vscode-descriptionForeground)',
});

export const link = css({
    textDecoration: 'none',
    ':hover': {
        textDecoration: 'underline',
    },
});

export const progressRing = css({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    margin: '10px 0',
});

export const flex = css({
    display: 'flex',
    overflow: 'hidden',
});

export const reset = css({
    margin: 0,
    padding: 0,
});

export const resetListItem = css({
    listStyle: 'none',
});

export const error = css({
    color: 'var(--vscode-errorForeground)',
    overflowWrap: 'break-word',
    margin: '5px 0',
});

export const app = css({
    fontFamily: '"Hiragino Maru Gothic Pro", "BIZ UDGothic", Roboto, HelveticaNeue, Arial, sans-serif',
    fontSize: 'var(--vscode-font-size)',
    lineHeight: '1.35',
    flexWrap: 'wrap',
    gap: '20px',
    marginTop: '10px',
});

export const appLeft = css({
    width: '100%',
    '@media(min-width: 460px)': {
        width: '200px',
    },
});

export const appRight = css({
    width: '100%',
    height: 'calc(100vh - 182px)',
    '@media(min-width: 460px)': {
        width: 'calc(100% - 220px)',
        height: 'calc(100vh - 20px)',
    },
});

export const note = css({
    marginBottom: '10px',
});

export const noteLeft = css({
    width: '44px',
    marginRight: '10px',
});

export const noteRight = css({
    width: `calc(100% - ${44 + 10}px)`,
});

export const noteHeader = css({
    justifyContent: 'space-between',
    whiteSpace: 'nowrap',
});

export const user = css({
    marginRight: '10px',
});

export const userAvatar = css({
    width: '44px',
    height: '44px',
    objectFit: 'cover',
    borderRadius: `${44 / 2}px`,
});

export const userName = css({
    flexShrink: 10,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginRight: '10px',
    fontWeight: 'bold',
});

export const userUserName = css({
    flexShrink: 100,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

export const userHost = css({
    flexShrink: 1000,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

export const noteText = css({
    overflowWrap: 'break-word',
});

export const noteFiles = css({
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '2.5px',
    margin: '2.5px 0',
});

export const noteFileThumbnail = css({
    maxWidth: '100px',
    maxHeight: '100px',
    verticalAlign: 'middle',
});

export const defaultFileThumbnail = css({
    display: 'inline-block',
    width: '100px',
    height: '100px',
    backgroundColor: 'var(--vscode-button-secondaryBackground)',
    verticalAlign: 'middle',
});

export const noteFileText = css({
    display: 'inline-block',
    verticalAlign: 'middle',
});

export const ItemContainer = styled.div`
  box-sizing: border-box;
  padding: 2px;
  width: 20%;
  background: var(--vscode-editor-background);
  display: flex;
  flex: none;
  align-content: stretch;
`;

export const ItemWrapper = styled.div`
    flex: 1;
    text-align: center;
    height: 25px;
    padding: 2px;
  }
`;

export const ListContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
` as GridComponents['List'];

export const hoverableEmoji = css({
    position: 'relative',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    width: '24px',
    height: '24px',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',

    'img': {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
    },

    '&:hover': {
        transform: 'translateY(-2px)',
    },

    '&:after': {
        content: 'attr(data-name)',
        position: 'absolute',
        bottom: '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--vscode-editor-background)',
        padding: '2px 4px',
        borderRadius: '4px',
        fontSize: '12px',
        opacity: '0',
        transition: 'opacity 0.2s',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
    },

    '&:hover:after': {
        opacity: 1,
    },
});