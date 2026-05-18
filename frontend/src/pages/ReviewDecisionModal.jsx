import { useState } from 'react';

export const ReviewDecisionModal = ({
  onClose,
  onSubmit,
}) => {
  const [comment, setComment] =
    useState('');

  return (
    <div className="card stack-md">
      <h3>Submit Review</h3>

      <textarea
        rows="5"
        placeholder="Write your review..."
        value={comment}
        onChange={(e) =>
          setComment(e.target.value)
        }
      />

      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <button
          className="primary-button"
          onClick={() =>
            onSubmit(
              'approved',
              comment
            )
          }
        >
          Approve
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            onSubmit(
              'changes_requested',
              comment
            )
          }
        >
          Request Changes
        </button>

        <button
          className="secondary-button"
          onClick={() =>
            onSubmit(
              'commented',
              comment
            )
          }
        >
          Comment
        </button>

        <button onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
};