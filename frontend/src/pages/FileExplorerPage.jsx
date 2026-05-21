import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import { gitApi } from '../api/services';
import { useApp } from '../contexts/AppContext';
import { Modal } from '../components/Modal';

const Editor = lazy(() => import('@monaco-editor/react'));

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

  const [commitOpen, setCommitOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async (path = currentPath) => {
    try {
      const data = await gitApi.files(repo.name, path);
      setListing(data);

      if (data.type === 'file') {
        setSelectedFile(data.path);
        setContent(data.content || '');
      }
    } catch (error) {
      pushToast(error.message || 'Failed to load files');
      setListing({ items: [] });
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
    try {
      if (item.type === 'dir') {
        setCurrentPath(item.path);

        const data = await gitApi.files(repo.name, item.path);
        setListing(data);
        return;
      }

      const data = await gitApi.files(repo.name, item.path);
      setSelectedFile(item.path);
      setContent(data.content || '');
    } catch (error) {
      pushToast(error.message || 'Failed to open item');
    }
  };

  const saveFile = () => {
    if (!selectedFile) {
      pushToast('No file selected');
      return;
    }

    setCommitOpen(true);
  };

  const confirmSaveFile = async () => {
    if (!commitMessage.trim()) {
      pushToast('Commit message required');
      return;
    }

    try {
      setSaving(true);

      await gitApi.saveFileWithCommit({
        repoName: repo.name,
        path: selectedFile,
        content,
        message: commitMessage.trim(),
      });

      pushToast('File committed successfully');

      setCommitOpen(false);
      setCommitMessage('');
      load(currentPath);
    } catch (error) {
      pushToast(error.message || 'Failed to save file');
    } finally {
      setSaving(false);
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
      pushToast(error.message || 'Failed to upload files');
    } finally {
      e.target.value = '';
    }
  };

  const createFolder = async (e) => {
    e.preventDefault();

    try {
      await gitApi.createFolder({
        repoName: repo.name,
        path: [currentPath, folderName].filter(Boolean).join('/'),
      });

      pushToast('Folder created');
      setFolderOpen(false);
      setFolderName('');
      load(currentPath);
    } catch (error) {
      pushToast(error.message || 'Failed to create folder');
    }
  };

 const deleteSelected = () => {
  const path = selectedFile || currentPath;

  if (!path) {
    pushToast('Nothing selected');
    return;
  }

  setDeleteOpen(true);
};
const confirmDelete = async () => {
  const path = selectedFile || currentPath;

  if (!path) return;

  try {
    setDeleteLoading(true);

    await gitApi.deletePath({
      repoName: repo.name,
      path,
    });

    setSelectedFile(null);
    setContent('');
    setCurrentPath('');

    pushToast('Path deleted successfully');

    setDeleteOpen(false);

    load('');
  } catch (error) {
    pushToast(error.message || 'Failed to delete path');
  } finally {
    setDeleteLoading(false);
  }
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
                <Suspense
                  fallback={
                    <div className="empty-card">Loading editor...</div>
                  }
                >
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

      <Modal
        open={commitOpen}
        title="Commit changes"
        onClose={() => {
          setCommitOpen(false);
          setCommitMessage('');
        }}
      >
        <div className="stack-md">
          <p>Enter a commit message for this file change.</p>

          <input
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Update file content"
            autoFocus
          />

          <div className="button-row">
            <button
              className="secondary-button"
              onClick={() => {
                setCommitOpen(false);
                setCommitMessage('');
              }}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              disabled={saving || !commitMessage.trim()}
              onClick={confirmSaveFile}
            >
              {saving ? 'Saving...' : 'Commit & Save'}
            </button>
          </div>
        </div>
      </Modal>
      <Modal
  open={deleteOpen}
  title="Delete confirmation"
  onClose={() => setDeleteOpen(false)}
>
  <div className="stack-md">
    <p>
      Are you sure you want to delete this{' '}
      <strong>
        {selectedFile ? 'file' : 'folder'}
      </strong>
      ?
    </p>

    <div
      style={{
        padding: '0.75rem',
        borderRadius: '8px',
        background: 'var(--surface-secondary)',
        wordBreak: 'break-word',
      }}
    >
      {selectedFile || currentPath}
    </div>

    <div className="button-row">
      <button
        className="secondary-button"
        onClick={() => setDeleteOpen(false)}
      >
        Cancel
      </button>

      <button
        className="primary-button"
        style={{
          background: '#dc2626',
        }}
        disabled={deleteLoading}
        onClick={confirmDelete}
      >
        {deleteLoading
          ? 'Deleting...'
          : 'Delete'}
      </button>
    </div>
  </div>
</Modal>
    </div>
  );
};