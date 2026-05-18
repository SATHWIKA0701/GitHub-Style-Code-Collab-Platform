import { useState } from 'react';
import { Modal } from './Modal';
import { FormField } from './FormField';

const decisions = [
  { value: 'approved', label: 'Approved' },
  { value: 'changes_requested', label: 'Changes requested' },
  { value: 'commented', label: 'Commented' },
];

export const ReviewDecisionModal = ({ onClose, onSubmit }) => {
  const [decision, setDecision] = useState('approved');
  const [body, setBody] = useState('');

  return (
    <Modal open title="Submit review" onClose={onClose}>
      <form
        className="stack-md"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(decision, body.trim());
        }}
      >
        <FormField label="Decision">
          <select value={decision} onChange={(e) => setDecision(e.target.value)}>
            {decisions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Comment">
          <textarea
            rows="4"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add an optional note for reviewers"
          />
        </FormField>
        <div className="button-row">
          <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button">Submit review</button>
        </div>
      </form>
    </Modal>
  );
};
