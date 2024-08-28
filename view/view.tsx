import { VSCodeButton, VSCodeDropdown, VSCodeOption, VSCodeProgressRing, VSCodeTextArea } from '@vscode/webview-ui-toolkit/react';
import React from "react";
import { useState, useEffect, useCallback } from "react";
import { createRoot } from 'react-dom/client';
import { useTimeline } from "./useTimeline";
import { useLoggedInAccount } from "./useLoggedInAccount";
import * as styles from './view.style';
import Linkify from "linkify-react";
import 'linkify-plugin-hashtag';
import 'linkify-plugin-mention';
import { Opts as LinkifyOptions } from 'linkifyjs';
import { Virtuoso, VirtuosoGrid, VirtuosoGridHandle } from "react-virtuoso";
import { Popover } from 'react-tiny-popover';
import { ViewBeforeLogin } from "./ViewBeforeLogin";
import { useLoggedInError } from './useLoggedInError';
import { useTimelineError } from "./useTimelineError";
import { useNotedError } from "./useNotedError";
import { useNotedListener } from './useNotedListener';
import { EmittingEvents, ListeningEvents } from '../src/ViewProvider';
import { useEmojis } from './useEmojis';
import EmojiSlate from './EmojiSlate';
import { Descendant } from 'slate';

declare global {
    function acquireVsCodeApi(): {
        postMessage: <Type extends keyof ListeningEvents>(message: { form: Type, inputs: ListeningEvents[Type]['inputs'] }) => void;
        getState: () => void;
        setState: (state: any) => void;
    };
}
const vscode = acquireVsCodeApi();

const createdAtFormatter = Intl.DateTimeFormat([], {
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
    minute: '2-digit',
});

type VisibilityOption = 'public' | 'home' | 'followers' | 'specified';

function App() {
    const [noteContent, setNoteContent] = useState('');
    const [visibilityOption, setVisibilityOption] = useState<VisibilityOption>('public');
    const notedError = useNotedError();
    const [noteCwOpened, setNoteCwOpened] = useState<{ [parentsNoteId: string]: boolean }>({});
    const [noteSensitiveFileOpened, setNoteSensitiveFileOpened] = useState<{ [parentsNoteId: string]: boolean }>({});
    const loggedInAccount = useLoggedInAccount();
    const loggedInError = useLoggedInError();
    const timeline = useTimeline();
    const [timelineSnapshot, setTimelineSnapshot] = useState(timeline);
    const timelineError = useTimelineError();
    const [isScrollAtTop, setIsScrollAtTop] = useState(true);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const emojis = useEmojis();

    useEffect(() => {
        vscode.postMessage({
            form: 'load',
            inputs: {},
        });
    }, []);

    const onLogin = (server: string, accessToken: string) => {
        vscode.postMessage({
            form: 'login',
            inputs: {
                server,
                accessToken,
            },
        });
    };

    const onLogout = () => {
        vscode.postMessage({
            form: 'logout',
            inputs: {},
        });
    };

    const onNote = () => {
        vscode.postMessage({
            form: 'note',
            inputs: {
                content: noteContent,
                visiability: visibilityOption,
            },
        });
    };

    const onEmojiSelectWindow = () => {
        setIsPopoverOpen(!isPopoverOpen);
    };

    useNotedListener(useCallback(() => {
        setNoteContent('');
    }, [setNoteContent]));

    if (loggedInAccount === undefined) {
        return <div className={styles.progressRing}>
            <VSCodeProgressRing />
        </div>;
    } else if (loggedInAccount === null) {
        return <ViewBeforeLogin
            loggedInError={loggedInError}
            onLogin={onLogin}
        />;
    }

    const linkifyOptions: LinkifyOptions = {
        className: styles.link,
        formatHref: {
            hashtag: (href) => `https://${loggedInAccount.host}/tags/${href.replace(/^\#/, '')}`,
            mention: (href) => `https://${loggedInAccount.host}${href.replace(/^\//, '/@')}`,
        },
        nl2br: true,
        validate: {
            url: (value) => /^https?:\/\//.test(value),
            email: () => false,
        },
    };

    return (
        <div className={[styles.app, styles.flex].join(' ')}>
            <div className={styles.appLeft}>
                <form action="#">
                    <div className={[styles.flex, styles.note].join(' ')}>
                        <div className={styles.noteLeft}>
                            <img
                                src={loggedInAccount.avatarUrl}
                                alt="My account avatar"
                                className={styles.userAvatar}
                            />
                        </div>
                        <div className={styles.noteRight}>
                            <div className={[styles.flex, styles.noteHeader].join(' ')}>
                                <div></div>
                                <div>
                                    <VSCodeButton
                                        appearance="secondary"
                                        onClick={onLogout}
                                    >
                                        Log out
                                    </VSCodeButton>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
                <form action="#">
                    <div>
                        <label>Visibility</label>
                        <VSCodeDropdown
                            value={visibilityOption}
                            onChange={(event) => setVisibilityOption(event.target.value as VisibilityOption)}
                        >
                            <VSCodeOption value='public'>Public</VSCodeOption>
                            <VSCodeOption value='home'>Home</VSCodeOption>
                            <VSCodeOption value='followers'>Followers</VSCodeOption>
                        </VSCodeDropdown>
                    </div>
                    <div>
                        <VSCodeTextArea
                            name="content"
                            value={noteContent}
                            resize="vertical"
                            onInput={(event) => setNoteContent(event.target.value)}
                            placeholder="What's happening around you?"
                            className={styles.formInput}
                        ></VSCodeTextArea>
                    </div>
                    {notedError !== undefined &&
                        <p className={styles.error}>{JSON.stringify(notedError)}</p>
                    }
                    <div>
                        <VSCodeButton onClick={onNote}>Note</VSCodeButton>
                        <EmojiSelectWindow
                            emojis={emojis}
                            setNoteContent={setNoteContent}
                            noteContent={noteContent}
                            isPopoverOpen={isPopoverOpen}
                            setIsPopoverOpen={setIsPopoverOpen}
                            onEmojiSelectWindow={onEmojiSelectWindow} />
                    </div>
                </form>
            </div>
            <div className={styles.appRight}>
                {timelineError !== undefined &&
                    <p className={styles.error}>{JSON.stringify(timelineError)}</p>
                }
                <Virtuoso
                    atTopStateChange={(atTop) => {
                        setTimelineSnapshot(timeline);
                        setIsScrollAtTop(atTop);
                    }}
                    computeItemKey={(index, note, context) => note.id}
                    data={isScrollAtTop ? timeline : timelineSnapshot}
                    itemContent={(index, note) => (
                        <div className={[styles.flex, styles.note].join(' ')}>
                            <div className={styles.noteLeft}>
                                <img
                                    src={note.user.avatarUrl}
                                    alt="User account avator"
                                    className={styles.userAvatar}
                                />
                            </div>
                            <div className={styles.noteRight}>
                                <div className={[styles.flex, styles.noteHeader].join(' ')}>
                                    <div className={[styles.flex, styles.user].join(' ')}>
                                        <div className={styles.userName}>{note.user.name}</div>
                                        <div className={styles.userUserName}>@{note.user.username}</div>
                                        {note.user.host &&
                                            <div className={styles.userHost}>@{note.user.host}</div>
                                        }
                                    </div>
                                    <div>
                                        <a
                                            href={`https://${loggedInAccount.host}/notes/${note.id}`}
                                            className={styles.link}
                                        >
                                            {createdAtFormatter.format(new Date(note.createdAt))}
                                        </a>
                                    </div>
                                </div>
                                <NoteContent
                                    note={note}
                                    parentsNoteId={note.id}
                                    cwOpened={noteCwOpened}
                                    onCwToggle={(parentsNoteId) => setNoteCwOpened({ ...noteCwOpened, [parentsNoteId]: !noteCwOpened[parentsNoteId] })}
                                    sensitiveFileOpened={noteSensitiveFileOpened}
                                    onSensitiveFileToggle={(parentsNoteId) => setNoteSensitiveFileOpened({ ...noteSensitiveFileOpened, [parentsNoteId]: !noteSensitiveFileOpened[parentsNoteId] })}
                                    linkifyOptions={linkifyOptions}
                                    loggedInAccount={loggedInAccount}
                                />
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>
    );
}

type CustomText = { text: string; emoji?: string };

const noteTextToEmojiSlate = (text: string, emojis: EmittingEvents['note']['message']['emojis'], loggedInAccount: any): Descendant[] => {
    const result: Descendant[] = [
        { type: 'paragraph', children: [] }
    ];

    if (text !== null) {
        const emojiRegex = /:([a-zA-Z0-9_+-]+):/g;
        const parts = text.split(emojiRegex);
        const emojiMatches = text.match(emojiRegex) || [];
        let children: CustomText[] = [];

        parts.forEach((part, index) => {
            if (part && !emojiMatches.some(emoji => emoji.includes(part))) {
                children.push({ text: part });
            } else {
                const emojiName = part;
                try {
                    children.push({ text: '', emoji: emojis[emojiName] });
                } catch (error) {
                    children.push({ text: `:${emojiName}:`, emoji: '' });
                    // TODO: noiced there are multiple network requests when scrolling, bad for performance
                    // axios.get(`https://${loggedInAccount.host}/api/emoji?name=${emojiName}`)
                    //     .then((response) => {
                    //         children.push({ text: '', emoji: response.data.url });
                    //     });
                }
            }
        });
        result[0]['children'] = children;
    }

    return result;
};

function NoteContent({ note, parentsNoteId, cwOpened, onCwToggle, sensitiveFileOpened, onSensitiveFileToggle, linkifyOptions, loggedInAccount }: {
    note: EmittingEvents['note']['message'];
    parentsNoteId: string;
    cwOpened: { [parentsNoteId: string]: boolean };
    onCwToggle: (parentsNoteId: string) => void;
    sensitiveFileOpened: { [parentsNoteId: string]: boolean };
    onSensitiveFileToggle: (parentNoteId: string) => void;
    linkifyOptions: LinkifyOptions;
    loggedInAccount: any;
}) {
    return (
        <>
            {note.cw && <>
                <span className={[styles.reset, styles.noteText].join(' ')}>
                    <EmojiSlate isReadOnly={true} initialValue={noteTextToEmojiSlate(note.cw, note.emojis, loggedInAccount)} loggedInAccount={loggedInAccount} />
                </span>
                <VSCodeButton
                    appearance="secondary"
                    onClick={() => onCwToggle(parentsNoteId)}
                >
                    {cwOpened[parentsNoteId] ? 'Hide' : 'Show'} content
                </VSCodeButton>
            </>}
            {(!note.cw || cwOpened[parentsNoteId]) && <>
                {note.text !== null &&
                    <span className={[styles.reset, styles.noteText].join(' ')}>
                        <EmojiSlate isReadOnly={true} initialValue={noteTextToEmojiSlate(note.text, note.emojis, loggedInAccount)} loggedInAccount={loggedInAccount} />
                    </span>
                }
                {note.files.some((file) => file.isSensitive) &&
                    <VSCodeButton
                        appearance="secondary"
                        onClick={() => onSensitiveFileToggle(parentsNoteId)}
                    >
                        {sensitiveFileOpened[parentsNoteId] ? 'Hide' : 'Show '} sensitive files
                    </VSCodeButton>
                }
                {note.files.length !== 0 &&
                    <div className={[styles.flex, styles.noteFiles].join(' ')}>
                        {note.files.map((file) => (
                            file.isSensitive && !sensitiveFileOpened[parentsNoteId]
                                ? <div
                                    key={file.id}
                                    className={styles.defaultFileThumbnail}
                                ></div>
                                : <a
                                    key={file.id}
                                    href={file.url}
                                    className={styles.link}
                                >
                                    {file.thumbnailUrl !== null
                                        ? <img
                                            src={file.thumbnailUrl}
                                            alt={file.comment ?? ''}
                                            className={styles.noteFileThumbnail}
                                        />
                                        : <div className={styles.noteFileText}>{file.name}</div>
                                    }
                                </a>
                        ))}
                    </div>
                }
                {note.renote && <>
                    <p className={[styles.reset, styles.noteText].join(' ')}>
                        <Linkify options={linkifyOptions}>
                            {`RN @${note.renote.user.username}${note.renote.user.host !== null ? '@' + note.renote.user.host : ''}`}
                        </Linkify>
                    </p>
                    <NoteContent
                        key={`${parentsNoteId}-${note.renote.id}`}
                        note={note.renote}
                        parentsNoteId={`${parentsNoteId}-${note.renote.id}`}
                        cwOpened={cwOpened}
                        onCwToggle={onCwToggle}
                        sensitiveFileOpened={sensitiveFileOpened}
                        onSensitiveFileToggle={onSensitiveFileToggle}
                        linkifyOptions={linkifyOptions}
                        loggedInAccount={loggedInAccount}
                    />
                </>}
            </>}
        </>
    );
};

function EmojiSelectWindow({ emojis, setNoteContent, noteContent, isPopoverOpen, setIsPopoverOpen, onEmojiSelectWindow }) {
    const ref = React.createRef<VirtuosoGridHandle>();

    const onEmojiClick = (noteContent, emoji) => {
        setNoteContent(noteContent + `:${emoji.name}:`);
    };

    return (
        <Popover
            isOpen={isPopoverOpen}
            positions={['bottom', 'left', 'right', 'top']} // preferred positions by priority
            content={
                <VirtuosoGrid
                    ref={ref}
                    components={{
                        Item: styles.ItemContainer,
                        List: styles.ListContainer,
                        ScrollSeekPlaceholder: () => (
                            <styles.ItemContainer>
                                <VSCodeProgressRing />
                            </styles.ItemContainer>
                        ),
                    }}
                    data={emojis}
                    scrollSeekConfiguration={{
                        enter: (velocity) => Math.abs(velocity) > 200,
                        exit: (velocity) => Math.abs(velocity) < 30,
                    }}
                    itemContent={(index, emoji) =>
                        <styles.ItemWrapper>
                            <div className={styles.hoverableEmoji} onClick={() => onEmojiClick(noteContent, emoji)}>
                                <img src={emoji.url} alt={emoji.name} />
                            </div>
                        </styles.ItemWrapper>}
                    style={{ height: 200, width: 300 }}
                />
            }
            onClickOutside={() => setIsPopoverOpen(false)}
        >
            <VSCodeButton onClick={onEmojiSelectWindow}>Emoji</VSCodeButton>
        </Popover>
    );
}

createRoot(document.querySelector('#app') as HTMLDivElement).render(<App />);
