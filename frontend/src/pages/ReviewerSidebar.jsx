export const ReviewerSidebar = ({
  reviews,
}) => {
  return (
    <div className="card stack-md">
      <h3>Reviews</h3>

      {reviews.length === 0 && (
        <p>No reviews yet.</p>
      )}

      {reviews.map((review, index) => (
        <div
          key={index}
          className="list-row"
        >
          <div>
            <strong>
              {
                review.userId
                  ?.username
              }
            </strong>
          </div>

          <div>
            {review.decision ===
              'approved' && (
              <span
                style={{
                  color: '#238636',
                  fontWeight: '600',
                }}
              >
                Approved
              </span>
            )}

            {review.decision ===
              'changes_requested' && (
              <span
                style={{
                  color: '#da3633',
                  fontWeight: '600',
                }}
              >
                Changes Requested
              </span>
            )}

            {review.decision ===
              'commented' && (
              <span
                style={{
                  color: '#1f6feb',
                  fontWeight: '600',
                }}
              >
                Commented
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};