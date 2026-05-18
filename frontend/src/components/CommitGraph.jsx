export const CommitGraph = ({
  commits,
}) => {
  return (
    <div
      style={{
        position: 'relative',
      }}
    >
      {commits.map(
        (commit, index) => (
          <div
            key={commit.hash}
            style={{
              display: 'flex',

              gap: '16px',

              marginBottom: '24px',

              position:
                'relative',
            }}
          >
            <div
              style={{
                display: 'flex',

                flexDirection:
                  'column',

                alignItems:
                  'center',
              }}
            >
              <div
                style={{
                  width: '14px',

                  height: '14px',

                  borderRadius:
                    '50%',

                  background:
                    '#1f6feb',

                  marginTop: '6px',
                }}
              />

              {index !==
                commits.length -
                  1 && (
                <div
                  style={{
                    width: '2px',

                    flex: 1,

                    background:
                      '#30363d',

                    minHeight:
                      '50px',
                  }}
                />
              )}
            </div>

            <div
              className="card"
              style={{
                flex: 1,

                padding: '16px',
              }}
            >
              <h4
                style={{
                  marginBottom:
                    '8px',
                }}
              >
                {commit.message}
              </h4>

              <div
                style={{
                  fontSize:
                    '13px',

                  opacity: 0.7,

                  display: 'flex',

                  justifyContent:
                    'space-between',
                }}
              >
                <span>
                  {commit.author}
                </span>

                <span>
                  {new Date(
                    commit.date
                  ).toLocaleString()}
                </span>
              </div>

              <div
                style={{
                  marginTop: '10px',

                  fontSize: '12px',

                  fontFamily:
                    'monospace',

                  opacity: 0.7,
                }}
              >
                {commit.hash}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};