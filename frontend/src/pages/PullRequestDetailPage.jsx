import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { FormField } from '../components/FormField';

import { prApi } from '../api/services';

import { useApp } from '../contexts/AppContext';

import { PRStatusBadge } from '../components/PRStatusBadge';

import { ReviewDecisionModal } from '../components/ReviewDecisionModal';

import { ReviewerSidebar } from '../components/ReviewerSidebar';

export const PullRequestDetailPage = () => {
  const { prId } = useParams();

  const { pushToast } = useApp();

  const [pr, setPr] = useState(null);

  const [comments, setComments] = useState([]);

  const [diff, setDiff] = useState('');

  const [
    showReviewModal,
    setShowReviewModal,
  ] = useState(false);

  const [form, setForm] = useState({
    prId,
    filePath: '',
    lineNumber: '',
    comment: '',
  });

  const load = async () => {
    try {
      const detail = await prApi.detail(prId);
      setPr(detail);
      const reviewComments = await prApi.comments(prId);
      setComments(reviewComments);
      const diffData = await prApi.diff(
        detail.repoName,
        detail.sourceBranch,
        detail.targetBranch
      );
      setDiff(diffData.diff || '');
    } catch (error) {
      pushToast('Failed to load PR');
    }
  };

  useEffect(() => {
    load();
  }, [prId]);

  const handleMergePR = async () => {
    try {
      await prApi.merge(pr._id);

      pushToast('Pull request merged');

      load();
    } catch (error) {
      pushToast(
        error.response?.data?.message ||
          'Failed to merge PR'
      );
    }
  };

  const handleClosePR = async () => {
    try {
      const response = await prApi.close(pr._id);

      setPr(response.pr);

      pushToast('Pull request closed');
    } catch (error) {
      pushToast(
        error.response?.data?.message ||
          'Failed to close PR'
      );
    }
  };

  const handleReopenPR = async () => {
    try {
      const response = await prApi.reopen(pr._id);

      setPr(response.pr);

      pushToast('Pull request reopened');
    } catch (error) {
      pushToast(
        error.response?.data?.message ||
          'Failed to reopen PR'
      );
    }
  };

  const submitReviewDecision =
    async (decision, body) => {
      try {
        await prApi.submitReview(
          pr._id,
          {
            decision,
            body,
          }
        );

        pushToast(
          'Review submitted'
        );

        setShowReviewModal(false);

        load();
      } catch (error) {
        pushToast(
          error.response?.data
            ?.message ||
            'Failed to submit review'
        );
      }
    };

  if (!pr) {
    return (
      <div className="loader-card">
        Loading pull request...
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <section className="card stack-md">
        <div className="section-header">
          <h1>{pr.title}</h1>
          <PRStatusBadge status={pr.status} />
        </div>

        <p>
          {pr.description ||
            'No description provided.'}
        </p>

        {pr.hasConflicts && (
          <div
            style={{
              background: '#3d2f00',
              border:
                '1px solid #f0b429',
              color: '#f0b429',
              padding: '14px',
              borderRadius: '10px',
              marginTop: '10px',
              marginBottom: '10px',
              fontWeight: '600',
            }}
          >
            ⚠ This branch has merge
            conflicts that must be
            resolved before
            merging.
          </div>
        )}

        <div className="meta-row">
          <span>
            {pr.sourceBranch} →{' '}
            {pr.targetBranch}
          </span>

          <span>
            {pr.createdBy
              ?.username ||
              'Unknown author'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginTop: '20px',
            flexWrap: 'wrap',
          }}
        >
          {pr.status === 'open' &&
            !pr.hasConflicts && (
              <>
                <button
                  className="primary-button"
                  onClick={
                    handleMergePR
                  }
                >
                  Merge pull request
                </button>

                <button
                  className="secondary-button"
                  onClick={
                    handleClosePR
                  }
                >
                  Close PR
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    setShowReviewModal(
                      true
                    )
                  }
                >
                  Review Changes
                </button>
              </>
            )}

          {pr.status === 'closed' && (
            <button
              className="primary-button"
              onClick={
                handleReopenPR
              }
            >
              Reopen PR
            </button>
          )}
        </div>
      </section>

      <div className="split-grid two">
        <div className="stack-md">
          <div className="card stack-md">
            <h3>Diff preview</h3>

            <pre className="diff-block">
              {diff ||
                'No diff available yet.'}
            </pre>
          </div>

          <ReviewerSidebar
            reviews={
              pr.reviewDecisions ||
              []
            }
          />
        </div>

        <div className="card stack-md">
          <h3>Review comments</h3>

          <div className="list-stack">
            {comments.map(
              (comment) => (
                <div
                  key={comment._id}
                  className="list-row compact"
                >
                  <strong>
                    {comment.filePath ||
                      'General'}
                  </strong>

                  <span>
                    {comment.comment}
                  </span>
                </div>
              )
            )}
          </div>

          <form
            className="stack-md"
            onSubmit={async (e) => {
              e.preventDefault();

              try {
                await prApi.addComment(
                  {
                    ...form,

                    lineNumber:
                      Number(
                        form.lineNumber ||
                          1
                      ),
                  }
                );

                setForm({
                  prId,

                  filePath: '',

                  lineNumber: '',

                  comment: '',
                });

                pushToast(
                  'Review comment added'
                );

                load();
              } catch (error) {
                pushToast(
                  error.response?.data
                    ?.message ||
                    'Failed to add comment'
                );
              }
            }}
          >
            <FormField label="File path">
              <input
                value={form.filePath}
                onChange={(e) =>
                  setForm({
                    ...form,

                    filePath:
                      e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Line number">
              <input
                type="number"
                min="1"
                value={form.lineNumber}
                onChange={(e) =>
                  setForm({
                    ...form,

                    lineNumber:
                      e.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Comment">
              <textarea
                rows="4"
                value={form.comment}
                onChange={(e) =>
                  setForm({
                    ...form,

                    comment:
                      e.target.value,
                  })
                }
                required
              />
            </FormField>

            <button className="primary-button">
              Add review comment
            </button>
          </form>
        </div>
      </div>

      {showReviewModal && (
        <ReviewDecisionModal
          onClose={() =>
            setShowReviewModal(
              false
            )
          }
          onSubmit={
            submitReviewDecision
          }
        />
      )}
    </div>
  );
};