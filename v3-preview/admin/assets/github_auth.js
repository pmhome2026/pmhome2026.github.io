function githubLogin(){

    // GitHub OAuth App 登录入口
    // 部署前需要填写 github_auth_config.js 中的 clientId

    const redirect = window.location.origin + 
        window.location.pathname;

    const url =
        "https://github.com/login/oauth/authorize"
        + "?client_id=" + GITHUB_ADMIN_CONFIG.clientId
        + "&redirect_uri=" + encodeURIComponent(redirect)
        + "&scope=read:user";

    window.location.href=url;
}


function saveGithubAdminSession(user){

    if(!GITHUB_ADMIN_CONFIG.admins.includes(user.login)){
        alert("当前 GitHub 账号没有管理员权限");
        return false;
    }

    localStorage.setItem(
        "admin_session",
        JSON.stringify({
            login:user.login,
            role:"Admin",
            provider:"github"
        })
    );

    return true;
}
