import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  Outlet,
  useLocation,
  useParams,
} from 'react-router-dom';

import { repoApi } from '../api/services';

import { RepoSidebar } from '../components/RepoSidebar';

import { useApp } from '../contexts/AppContext';

import { RepoTopic } from '../components/RepoTopic';

import { ReadmePreview } from '../components/ReadmePreview';

export const RepositoryPage = () => {
  const { repoId } = useParams();

  const [repo, setRepo] =
    useState(null);

  const [readme, setReadme] =
    useState('');

  const location = useLocation();

  const { setCurrentRepo } =
    useApp();

  useEffect(() => {
    repoApi
      .detail(repoId)
      .then((data) => {
        setRepo(data);

        setCurrentRepo(data);

        if (data.readme) {
          setReadme(
            data.readme
          );
        }
      })
      .catch(() =>
        setRepo(null)
      );

    return () => setCurrentRepo(null);
  }, [repoId, setCurrentRepo]);

  if (!repo)
    return (
      <div className="loader-card">
        Loading repository…
      </div>
    );

  return (
    <div className="repo-layout">
      <div className="repo-main stack-lg">
        <section className="repo-banner card">
          <div>
            <div className="eyebrow">
              Repository
            </div>

            <h1>{repo.name}</h1>

            <p>
              {repo.description ||
                'No description yet.'}
            </p>

            <div
              style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                marginTop: '14px',
              }}
            >
              {repo.topics?.map(
                (
                  topic,
                  index
                ) => (
                  <RepoTopic
                    key={index}
                    topic={topic}
                  />
                )
              )}
            </div>
          </div>

          <div className="repo-banner-meta">
            <span className="pill">
              {repo.visibility}
            </span>

            <span className="pill">
              default:{' '}
              {
                repo.defaultBranch
              }
            </span>
          </div>
        </section>

        {location.pathname ===
        `/repos/${repoId}` ? (
          <>
            <div className="code-overview card">
              <div className="overview-grid">
                <Link
                  to={`/repos/${repoId}/files`}
                  className="hover-card compact-card"
                >
                  <strong>
                    Files
                  </strong>

                  <p>
                    Browse and
                    edit
                    repository
                    content.
                  </p>
                </Link>

                <Link
                  to={`/repos/${repoId}/commits`}
                  className="hover-card compact-card"
                >
                  <strong>
                    Commits
                  </strong>

                  <p>
                    Inspect the
                    latest commit
                    history.
                  </p>
                </Link>

                <Link
                  to={`/repos/${repoId}/branches`}
                  className="hover-card compact-card"
                >
                  <strong>
                    Branches
                  </strong>

                  <p>
                    Create,
                    switch, and
                    merge
                    branches.
                  </p>
                </Link>

                <Link
                  to={`/repos/${repoId}/pulls`}
                  className="hover-card compact-card"
                >
                  <strong>
                    Pull requests
                  </strong>

                  <p>
                    Open,
                    review, and
                    merge pull
                    requests.
                  </p>
                </Link>
              </div>
            </div>

            {readme && (
              <ReadmePreview
                content={
                  readme
                }
              />
            )}
          </>
        ) : (
          <Outlet
            context={{
              repo,

              refreshRepo: () =>
                repoApi
                  .detail(repoId)
                  .then(setRepo),
            }}
          />
        )}
      </div>

      <RepoSidebar repoId={repoId} />
    </div>
  );
};