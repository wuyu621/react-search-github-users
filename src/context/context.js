import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);
  //request loading
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState({ show: false, msg: "" });
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        const {
          rate: { remaining },
        } = data;
        setRequests(remaining);
        if (remaining === 0) {
          toggleError(true, "sorry, you have exceeded your hourly rate limit ");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const getGithubUser = async (user) => {
    //setError to default value
    toggleError();
    setLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    console.log(response);

    if (response) {
      setGithubUser(response.data);
      const { repos_url, followers_url } = response.data;

      Promise.allSettled([
        axios(`${repos_url}?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        console.log(results);
        const [repos, followers] = results;
        const status = "fulfilled";
        if (repos.status === status) {
          setRepos(repos.value.data);
        }
        if (followers.status === status) {
          setFollowers(followers.value.data);
        }
      });
    } else {
      toggleError(true, "there is no user with that user name");
    }
    checkRequests();
    setLoading(false);
  };

  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }

  useEffect(() => {
    checkRequests();
  }, []);

  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        loading,
        setGithubUser,
        getGithubUser,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubContext, GithubProvider };
