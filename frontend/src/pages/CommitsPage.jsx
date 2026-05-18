import {
  useEffect,
  useState,
} from 'react';

import { useOutletContext } from 'react-router-dom';

import { gitApi } from '../api/services';

import { CommitGraph } from '../components/CommitGraph';

export const CommitsPage = () => {
  const { repo } =
    useOutletContext();

  const [commits, setCommits] =
    useState([]);

  useEffect(() => {
    gitApi
      .commits(repo.name)
      .then((data) =>
        setCommits(
          data.all || []
        )
      )
      .catch(() =>
        setCommits([])
      );
  }, [repo.name]);

  return (
    <div className="stack-lg">
      <div className="card">
        <div className="section-header">
          <h3>
            Commit History
          </h3>
        </div>

        {commits.length ? (
          <CommitGraph
            commits={commits.map(
              (commit) => ({
                hash:
                  commit.hash,

                message:
                  commit.message,

                author:
                  commit.author_name,

                date:
                  commit.date,
              })
            )}
          />
        ) : (
          <div className="empty-card">
            No commits yet.
          </div>
        )}
      </div>
    </div>
  );
};