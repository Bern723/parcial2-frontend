(() => {
  const USERS = [{ username: "admin", password: "admin" }];

  function setAuth(user){
    localStorage.setItem("authUser", JSON.stringify({ username: user.username, ts: Date.now() }));
  }
  function clearAuth(){
    localStorage.removeItem("authUser");
  }
  function getAuth(){
    try {
      const raw = localStorage.getItem("authUser");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  window.Auth = { USERS, setAuth, clearAuth, getAuth };
})();
