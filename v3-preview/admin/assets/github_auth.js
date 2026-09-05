async function startGithubDeviceLogin(){

    const status=document.getElementById("status");

    const clientId = window.GITHUB_ADMIN_CONFIG.clientId;

    if(!clientId || clientId==="YOUR_GITHUB_OAUTH_CLIENT_ID"){
        status.innerText="请先配置 GitHub Client ID";
        return;
    }

    status.innerText="正在连接 GitHub...";

    const res = await fetch(
        "https://github.com/login/device/code",
        {
            method:"POST",
            headers:{
                "Accept":"application/json",
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                client_id:clientId,
                scope:"read:user"
            })
        }
    );

    const data = await res.json();

    if(!data.user_code){
        status.innerText="GitHub Device Flow 初始化失败";
        return;
    }

    alert(
        "请打开:\n"+
        data.verification_uri+
        "\n输入验证码:\n"+
        data.user_code
    );

    status.innerText="等待 GitHub 授权...";

    const timer=setInterval(async()=>{

        const tokenRes = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method:"POST",
                headers:{
                    "Accept":"application/json",
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    client_id:clientId,
                    device_code:data.device_code,
                    grant_type:"urn:ietf:params:oauth:grant-type:device_code"
                })
            }
        );

        const token = await tokenRes.json();

        if(token.access_token){

            clearInterval(timer);

            const userRes = await fetch(
                "https://api.github.com/user",
                {
                    headers:{
                        Authorization:"Bearer "+token.access_token
                    }
                }
            );

            const user = await userRes.json();

            localStorage.setItem(
                "github_admin_session",
                JSON.stringify({
                    login:user.login,
                    id:user.id,
                    time:Date.now()
                })
            );

            window.location.href="index.html";
        }

    },5000);

}
