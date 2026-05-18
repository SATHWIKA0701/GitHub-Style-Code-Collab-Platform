export const ReviewerSidebar = ({ reviews = [] }) => {
  const approvedCount = reviews.filter((review) => review.decision === 'approved').length;
  const changesCount = reviews.filter((review) => review.decision === 'changes_requested').length;

  return (
    <div className="card stack-md">
      <h3>Reviews</h3>
      <div className="meta-row wrap">
        <span className="pill">Approved: {approvedCount}</span>
        <span className="pill">Changes: {changesCount}</span>
        <span className="pill">Total: {reviews.length}</span>
      </div>
      <div className="list-stack">
        {reviews.map((review) => (
          <div key={review?._id || `${review.userId}-${review.decidedAt}`} className="list-row compact">
            <div>
              <strong>{review.userId?.username || review.userId?.email || review.userId || 'Reviewer'}</strong>
              <p>{review.decision || 'commented'}</p>
            </div>
            <span className="subtle">
              {review.decidedAt ? new Date(review.decidedAt).toLocaleString() : 'Pending'}
            </span>
          </div>
        ))}
        {!reviews.length && <div className="empty-card">No reviews yet.</div>}
      </div>
    </div>
  );
};
