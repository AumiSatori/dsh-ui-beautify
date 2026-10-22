import React from 'react'

// Synthetic behavior only. Public data markers and (optionally) the installed
// InputBar stylesheet are borrowed for compatibility checks; no messages leave.
export function ComposerFixture() {
  const editor = React.useRef(null), fileInput = React.useRef(null), composing = React.useRef(false)
  const [files, setFiles] = React.useState([]), [menu, setMenu] = React.useState(false), [hasText, setHasText] = React.useState(false)
  const [recording, setRecording] = React.useState(false), [voice, setVoice] = React.useState(false)
  const sent = React.useRef([])
  window.composerTest = { sent: sent.current }
  const addFiles = incoming => setFiles(current => [...current, ...Array.from(incoming, file => file.name)])
  const send = () => {
    if (composing.current) return
    sent.current.push({ text: editor.current.innerText, files })
    editor.current.textContent = ''; setHasText(false); setFiles([])
  }
  return <div className="cf_root"><section className="cf_card" data-composer-card="true"
    onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); addFiles(event.dataTransfer.files) }}>
    <div className="cf_overlayAnchor" data-composer-overlay="true">{menu && <div role="menu" className="cf_fixture_menu"><button role="menuitem" onClick={() => setMenu(false)}>合成模型选项</button></div>}</div>
    {files.length > 0 && <ul className="cf_fixture_files" aria-label="合成附件">{files.map((name, index) => <li key={index}>{name}</li>)}</ul>}
    <div className="cf_scroll"><div className="cf_grow">
      <div ref={editor} className="cf_input" data-composer-input="true" contentEditable suppressContentEditableWarning role="textbox" aria-label="合成消息输入" aria-multiline="true"
        onInput={event => setHasText(Boolean(event.currentTarget.textContent))}
        onCompositionStart={() => { composing.current = true }} onCompositionEnd={() => { composing.current = false }}
        onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !composing.current) { event.preventDefault(); send() } }}/>
      {!hasText && <div className="cf_placeholder" data-composer-placeholder="true">发送消息…</div>}
    </div></div>
    <div className="cf_row"><div className="cf_tools">
      <button className="cf_add" aria-label="合成添加附件" onClick={() => fileInput.current.click()}>＋</button>
      <input ref={fileInput} type="file" hidden multiple aria-label="合成文件选择" onChange={event => addFiles(event.currentTarget.files)}/>
      <button className="cf_select" aria-label="合成模型选择" onClick={() => setMenu(value => !value)}>DeepSeek</button>
    </div><div className="cf_trailing">
      <button className="vf_trigger" aria-label="合成麦克风" aria-pressed={recording} onClick={() => setRecording(value => !value)}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v7m-3-5v4a3 3 0 0 0 6 0V4M8 11v3m-3 0h6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></button>
      <button className="vf_voice" aria-label="合成语音" aria-pressed={voice} onClick={() => setVoice(value => !value)}><svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 7v4m3-7v10m3-12v14m3-12v10m3-7v4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></button>
      <button className="cf_primary" aria-label="合成发送" onClick={send}>↑</button>
    </div></div>
  </section><div className="cf_dock" data-composer-dock="true"/></div>
}
