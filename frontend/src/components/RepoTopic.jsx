export const RepoTopic = ({
  topic,
}) => {
  return (
    <span
      style={{
        background: '#1f6feb22',

        color: '#1f6feb',

        padding: '6px 12px',

        borderRadius: '20px',

        fontSize: '13px',

        fontWeight: '600',

        display: 'inline-flex',

        alignItems: 'center',

        justifyContent: 'center',

        border:
          '1px solid #1f6feb55',

        whiteSpace: 'nowrap',
      }}
    >
      {topic}
    </span>
  );
};