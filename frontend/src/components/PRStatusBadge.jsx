export const PRStatusBadge = ({ status }) => {
  const getStyles = () => {
    switch (status) {
      case 'open':
        return {
          background: '#238636',
          color: 'white',
        };

      case 'merged':
        return {
          background: '#8957e5',
          color: 'white',
        };

      case 'closed':
        return {
          background: '#da3633',
          color: 'white',
        };

      default:
        return {
          background: '#444',
          color: 'white',
        };
    }
  };

  return (
    <span
      style={{
        padding: '5px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        ...getStyles(),
      }}
    >
      {status}
    </span>
  );
};