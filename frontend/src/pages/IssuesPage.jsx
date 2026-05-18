import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import {
  issueApi,
  repoApi,
} from '../api/services';

import { Modal } from '../components/Modal';

import { FormField } from '../components/FormField';

import { useApp } from '../contexts/AppContext';

import { IssueLabel } from '../components/IssueLabel';

export const IssuesPage = () => {
  const { repo } = useOutletContext();

  const { pushToast } = useApp();

  const [issues, setIssues] =
    useState([]);

  const [
    selectedIssue,
    setSelectedIssue,
  ] = useState(null);

  const [comments, setComments] =
    useState([]);

  const [issueOpen, setIssueOpen] =
    useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    labels: [],
  });

  const [commentText, setCommentText] =
    useState('');

  const load = () =>
    repoApi
      .issues(repo._id)
      .then(setIssues);

  useEffect(() => {
    load();
  }, [repo._id]);

  const openIssue = async (issue) => {
    setSelectedIssue(issue);

    const data =
      await issueApi.comments(
        issue._id
      );

    setComments(data);
  };

  const toggleLabel = (
    name,
    color
  ) => {
    const exists =
      form.labels.find(
        (l) => l.name === name
      );

    if (exists) {
      setForm({
        ...form,

        labels:
          form.labels.filter(
            (l) => l.name !== name
          ),
      });
    } else {
      setForm({
        ...form,

        labels: [
          ...form.labels,

          {
            name,
            color,
          },
        ],
      });
    }
  };

  return (
    <div className="stack-lg">
      <div className="section-header">
        <h2>Issues</h2>

        <button
          className="primary-button"
          onClick={() =>
            setIssueOpen(true)
          }
        >
          New issue
        </button>
      </div>

      <div className="card list-stack">
        {issues.map((issue) => (
          <button
            key={issue._id}
            className="list-row"
            onClick={() =>
              openIssue(issue)
            }
          >
            <div>
              <strong>
                {issue.title}
              </strong>

              <p>
                {issue.description ||
                  'No description'}
              </p>

              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                {issue.labels?.map(
                  (label, index) => (
                    <IssueLabel
                      key={index}
                      label={label}
                    />
                  )
                )}
              </div>
            </div>

            <span
              className={`pill ${
                issue.status ===
                'closed'
                  ? 'pill-danger'
                  : ''
              }`}
            >
              {issue.status}
            </span>
          </button>
        ))}

        {!issues.length && (
          <div className="empty-card">
            No issues yet.
          </div>
        )}
      </div>

      {selectedIssue ? (
        <div className="split-grid two">
          <div className="card stack-md">
            <div className="section-header">
              <h3>
                {selectedIssue.title}
              </h3>

              <span className="pill">
                {selectedIssue.status}
              </span>
            </div>

            <p>
              {
                selectedIssue.description
              }
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              {selectedIssue.labels?.map(
                (label, index) => (
                  <IssueLabel
                    key={index}
                    label={label}
                  />
                )
              )}
            </div>

            {selectedIssue.status !==
              'closed' && (
              <button
                className="secondary-button"
                onClick={async () => {
                  await issueApi.close(
                    selectedIssue._id
                  );

                  pushToast(
                    'Issue closed'
                  );

                  openIssue({
                    ...selectedIssue,

                    status: 'closed',
                  });

                  load();
                }}
              >
                Close issue
              </button>
            )}
          </div>

          <div className="card stack-md">
            <h3>Comments</h3>

            <div className="list-stack">
              {comments.map(
                (comment) => (
                  <div
                    key={comment._id}
                    className="list-row compact"
                  >
                    <strong>
                      {comment.userId
                        ?.username ||
                        'User'}
                    </strong>

                    <span>
                      {comment.text}
                    </span>
                  </div>
                )
              )}
            </div>

            <textarea
              rows="4"
              value={commentText}
              onChange={(e) =>
                setCommentText(
                  e.target.value
                )
              }
              placeholder="Leave a comment"
            />

            <button
              className="primary-button"
              onClick={async () => {
                await issueApi.addComment(
                  selectedIssue._id,
                  {
                    text: commentText,
                  }
                );

                setCommentText('');

                pushToast(
                  'Comment added'
                );

                openIssue(
                  selectedIssue
                );
              }}
            >
              Add comment
            </button>
          </div>
        </div>
      ) : null}

      <Modal
        open={issueOpen}
        title="Create issue"
        onClose={() =>
          setIssueOpen(false)
        }
      >
        <form
          className="stack-md"
          onSubmit={async (e) => {
            e.preventDefault();

            await repoApi.createIssue(
              repo._id,
              form
            );

            setIssueOpen(false);

            setForm({
              title: '',
              description: '',
              labels: [],
            });

            pushToast(
              'Issue created'
            );

            load();
          }}
        >
          <FormField label="Title">
            <input
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,

                  title:
                    e.target.value,
                })
              }
              required
            />
          </FormField>

          <FormField label="Description">
            <textarea
              rows="5"
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,

                  description:
                    e.target.value,
                })
              }
            />
          </FormField>

          <div className="stack-sm">
            <label>
              Select Labels
            </label>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  toggleLabel(
                    'bug',
                    '#da3633'
                  )
                }
              >
                Bug
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  toggleLabel(
                    'feature',
                    '#1f6feb'
                  )
                }
              >
                Feature
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  toggleLabel(
                    'documentation',
                    '#8250df'
                  )
                }
              >
                Documentation
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '10px',
              }}
            >
              {form.labels.map(
                (label, index) => (
                  <IssueLabel
                    key={index}
                    label={label}
                  />
                )
              )}
            </div>
          </div>

          <button className="primary-button">
            Create issue
          </button>
        </form>
      </Modal>
    </div>
  );
};