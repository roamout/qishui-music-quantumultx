// ============================================================
// 汽水音乐 自动签到 / 领免费时长 —— Surge + Quantumult X 双平台脚本
// 用法：
//   1. 用抓包工具抓到汽水音乐 App 的「签到」/「领时长」接口，提取：
//        - 请求 URL、方法 GET/POST
//        - Cookie / User-Agent / 签名头 / body
//   2. 把 CONFIG.tasks 填成你的真实接口和 Cookie
//   3. 部署：
//      【Surge】 在配置文件 [Script] 段添加：
//          cron "* * * * *" script-path=脚本路径, tag=汽水音乐
//        （上面 cron 改成你想要的定时，如 "0 9 * * *" 每天9点）
//      【Quantumult X】 在 [task_local] 段添加：
//          event-interval 汽水音乐签到, tag=汽水音乐, script-path=脚本路径, *, */30 * * * *
// ============================================================

// ---------- 配置区（改成你自己的） ----------
const CONFIG = {
    tasks: [
        {
            name: "每日签到",
            method: "POST",                      // GET 或 POST
            url: "https://xxx.qishui.example.com/api/sign",  // ← 改成真实接口
            headers: {
                "Cookie": "你的Cookie",           // ← 改成你的 Cookie
                "User-Agent": "你的UA",           // ← 改成你的 UA
                "Content-Type": "application/json",
                // 如需签名/X-Token 等额外头，在这里加
            },
            body: "{}",                           // POST 时填，GET 留空
        },
        // 可继续追加「领免费时长」等接口
        // {
        //     name: "领取免费时长",
        //     method: "POST",
        //     url: "https://xxx.qishui.example.com/api/free-time",
        //     headers: { "Cookie": "你的Cookie" },
        //     body: "{}",
        // },
    ],
};

// ---------- 环境适配层（自动识别 Surge / Quantumult X） ----------
const ENV = {
    isSurge: typeof $httpClient !== "undefined" && typeof $utils !== "undefined",
    isQX: typeof $task !== "undefined",
    isLoon: typeof $loon !== "undefined",
};

function notify(title, subtitle, message) {
    console.log(`[${title}] ${subtitle}\n${message}`);
    if (ENV.isSurge) {
        $notification.post(title, subtitle, message);
    } else if (ENV.isQX) {
        $notify(title, subtitle, message);
    } else if (ENV.isLoon) {
        $notification.post(title, subtitle, message);
    }
}

// 统一请求函数：返回 { statusCode, body, headers }
function fetchReq(task) {
    const opt = {
        url: task.url,
        headers: task.headers || {},
    };
    const isPost = task.method === "POST";
    if (isPost) opt.body = task.body || "{}";

    return new Promise((resolve, reject) => {
        if (ENV.isSurge || ENV.isLoon) {
            $httpClient[isPost ? "post" : "get"](opt, (err, resp, data) => {
                if (err) return reject(err);
                resolve({ statusCode: resp.status, body: data, headers: resp.headers });
            });
        } else if (ENV.isQX) {
            opt.method = isPost ? "POST" : "GET";
            $task.fetch(opt).then(
                (resp) => resolve({ statusCode: resp.statusCode, body: resp.body, headers: resp.headers }),
                reject
            );
        } else {
            reject(new Error("未识别的运行环境"));
        }
    });
}

// ---------- 逻辑区 ----------
async function run() {
    const results = [];
    for (const task of CONFIG.tasks) {
        try {
            const resp = await fetchReq(task);
            let msg = `HTTP ${resp.statusCode}`;
            try {
                const json = JSON.parse(resp.body);
                msg += ` | ${JSON.stringify(json).slice(0, 200)}`;
            } catch (e) {
                msg += ` | ${String(resp.body).slice(0, 200)}`;
            }
            results.push(`${task.name}: ${msg}`);
        } catch (e) {
            results.push(`${task.name}: 请求失败 ${e.message}`);
        }
    }
    notify("汽水音乐", "任务执行结果", results.join("\n"));
    if (typeof $done === "function") $done();
}

run();
