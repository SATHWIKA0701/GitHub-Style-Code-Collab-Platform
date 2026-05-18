export const IssueLabel = ({
  label,
}) => {
  return (
    <span
      style={{
        background:
          label.color ||
          '#1f6feb',

        color: 'white',

        padding: '5px 10px',

        borderRadius: '20px',

        fontSize: '12px',

        fontWeight: '600',

        marginRight: '8px',

        display: 'inline-block',
      }}
    >
      {label.name}
    </span>
  );
};