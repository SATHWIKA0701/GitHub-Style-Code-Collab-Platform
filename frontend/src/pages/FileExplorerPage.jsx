//FileExplorerPage.jsx
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const Editor = lazy(() => import('@monaco-editor/react'));
import { gitApi } from '../api/services';
import { useApp } from '../contexts/AppContext';
import { Modal } from '../components/Modal';

export const FileExplorerPage = () => {
  const { repo } = useOutletContext();
  const { pushToast } = useApp();
  const fileInputRef = useRef(null);

  const [currentPath, setCurrentPath] = useState('');
  const [listing, setListing] = useState({ items: [] });
  const [selectedFile, setSelectedFile] = useState(null);
  const [content, setContent] = useState('');
  const [folderName, setFolderName] = useState('');
  const [folderOpen, setFolderOpen] = useState(false);

  const load = async (path = currentPath) => {
    const data = await gitApi.files(repo.name, path);
    setListing(data);

    if (data.type === 'file') {
      setSelectedFile(data.path);
      setContent(data.content || '');
    }
  };

  useEffect(() => {
    load('');
  }, [repo.name]);

  const breadcrumbs = useMemo(
    () => currentPath.split('/').filter(Boolean),
    [currentPath]
  );

  const isMarkdown =
    selectedFile?.toLowerCase().endsWith('.md') ||
    selectedFile?.toLowerCase().endsWith('.markdown');

  const openItem = async (item) => {
    if (item.type === 'dir') {
      setCurrentPath(item.path);
      const data = await gitApi.files(repo.name, item.path);
      setListing(data);
      return;
    }

    const data = await gitApi.files(repo.name, item.path);
    setSelectedFile(item.path);
    setContent(data.content || '');
  };

 const saveFile = async () => {
  if (!selectedFile) return;

  const message = window.prompt('Enter commit message for this file change:');

  if (!message || !message.trim()) {
    pushToast('Commit message is required');
    return;
  }

  try {
    await gitApi.saveFileWithCommit({
      repoName: repo.name,
      path: selectedFile,
      content,
      message: message.trim(),
    });

    pushToast('File saved and committed');
  } catch (error) {
    pushToast(error.message);
  }
};

const upload = async (e) => {
  const files = e.target.files;

  if (!files?.length) return;

  try {
    await gitApi.uploadFiles({
      repoName: repo.name,
      directory: currentPath,
      files,
    });

    pushToast('Files uploaded');
    load(currentPath);
  } catch (error) {
    pushToast(error.message);
  } finally {
    e.target.value = '';
  }
};

  const createFolder = async (e) => {
    e.preventDefault();

    await gitApi.createFolder({
      repoName: repo.name,
      path: [currentPath, folderName].filter(Boolean).join('/'),
    });

    pushToast('Folder created');
    setFolderOpen(false);
    setFolderName('');
    load(currentPath);
  };

  const deleteSelected = async () => {
    const path = selectedFile || currentPath;

    if (!path) return;

    await gitApi.deletePath({
      repoName: repo.name,
      path,
    });

    setSelectedFile(null);
    setContent('');
    setCurrentPath('');
    pushToast('Path deleted');
    load('');
  };

  return (
    <div className="stack-md">
      <div className="toolbar card wrap">
        <div className="breadcrumbs">
          <button
            onClick={() => {
              setCurrentPath('');
              load('');
            }}
            className="ghost-button"
          >
            root
          </button>

          {breadcrumbs.map((crumb, index) => (
            <button
              key={crumb + index}
              className="ghost-button"
              onClick={() => {
                const nextPath = breadcrumbs.slice(0, index + 1).join('/');
                setCurrentPath(nextPath);
                load(nextPath);
              }}
            >
              {crumb}
            </button>
          ))}
        </div>

        <div className="button-row">
          <button
            className="secondary-button"
            onClick={() => setFolderOpen(true)}
          >
            New folder
          </button>

          <button
            className="secondary-button"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload files
          </button>

          <button className="ghost-button" onClick={deleteSelected}>
            Delete
          </button>
        </div>

        <input
          hidden
          ref={fileInputRef}
          type="file"
          multiple
          onChange={upload}
        />
      </div>

      <div className="explorer-grid">
        <div className="card list-stack">
          {(listing.items || []).map((item) => (
            <button
              key={item.path}
              className="file-row"
              onClick={() => openItem(item)}
            >
              <span>
                {item.type === 'dir' ? '📁' : '📄'} {item.name}
              </span>
              <small>{item.type}</small>
            </button>
          ))}

          {!listing.items?.length && (
            <div className="empty-card">This folder is empty.</div>
          )}
        </div>

        <div className="card editor-card">
          {selectedFile ? (
            <>
              <div className="section-header">
                <strong>{selectedFile}</strong>
                <button className="primary-button small" onClick={saveFile}>
                  Save file
                </button>
              </div>

              {isMarkdown ? (
                <div className="markdown-preview">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              ) : (
                <Suspense fallback={<div className="empty-card">Loading editor...</div>}>
                  <Editor
                    height="65vh"
                    theme="vs-dark"
                    value={content}
                    onChange={(value) => setContent(value || '')}
                  />
                </Suspense>
              )}
            </>
          ) : (
            <div className="empty-card">
              Select a file to inspect or edit it.
            </div>
          )}
        </div>
      </div>

      <Modal
        open={folderOpen}
        title="Create folder"
        onClose={() => setFolderOpen(false)}
      >
        <form className="stack-md" onSubmit={createFolder}>
          <input
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            required
          />
          <button className="primary-button">Create</button>
        </form>
      </Modal>
    </div>
  );
};