function startGithubLogin(){
    if(!window.GITHUB_ADMIN_CONFIG){
        alert("GitHub认证配置不存在");
        return;
    }

    if(
        GITHUB_ADMIN_CONFIG.clientId==="YOUR_GITHUB_CLIENT_ID"
    ){
        alert("请先配置GitHub OAuth Client ID");
        return;
    }

    const redirect =
        window.location.origin +
        window.location.pathname;

    const url =
        "https://github.com/login/oauth/authorize" +
        "?client_id=" + encodeURIComponent(GITHUB_ADMIN_CONFIG.clientId) +
        "&redirect_uri=" + encodeURIComponent(redirect) +
        "&scope=read:user";

    window.location.href=url;
}


// OAuth回调处理
async function handleGithubCallback(){
    const params=new URLSearchParams(
        window.location.search
    );

    const code=params.get("code");

    if(!code){
        return;
    }

    // 注意：
    // 纯GitHub Pages无法安全保存OAuth Client Secret。
    // 此处只保留流程入口，正式换token需要后端。
    alert(
      "已获得GitHub授权回调，但当前GitHub Pages无后端交换token能力。"
    );
}

handleGithubCallback();
