// ============================================================
// 汽水音乐 自动签到 / 领免费时长 —— Quantumult X 任务脚本模板
// 用法：
//   1. 用抓包工具（如 Stream / Charles / Quantumult X 自带的 http 日志）
//      抓到汽水音乐 App 的「签到」和「领时长」接口，提取：
//        - 请求 URL（含域名、路径）
//        - 请求方法 GET/POST
//        - 请求头里的 Cookie（以及必要的 UA、签名等）
//        - POST 时的 body
//   2. 把下面的 CONFIG 部分替换成你的真实接口和 Cookie
//   3. Quantumult X 配置 [task_local] 添加一行：
//        event-interval 汽水音乐签到, path=脚本路径, tag=汽水音乐, img-url=xxx, *, 定时cron
//      或手动在「设置 > 构造请求」/「运行脚本」里执行
// ============================================================

// ---------- 配置区（改成你自己的） ----------
const CONFIG = {
    // 签到 / 领时长的接口，可写多个。每个接口一个对象。
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

// ---------- 逻辑区（一般不用改） ----------
const $ = {
    notify: (title, subtitle, message) => {
        console.log(`[${title}] ${subtitle}\n${message}`);
        if (typeof $notify === "function") {
            $notify(title, subtitle, message);
        }
    },
};

async function run() {
    const results = [];
    for (const task of CONFIG.tasks) {
        try {
            const opt = {
                url: task.url,
                headers: task.headers || {},
            };
            if (task.method === "POST") {
                opt.method = "POST";
                opt.body = task.body || "{}";
            } else {
                opt.method = "GET";
            }
            const resp = await $task.fetch(opt);
            let msg = `HTTP ${resp.statusCode}`;
            try {
                const json = JSON.parse(resp.body);
                msg += ` | ${JSON.stringify(json).slice(0, 200)}`;
            } catch (e) {
                msg += ` | ${resp.body.slice(0, 200)}`;
            }
            results.push(`${task.name}: ${msg}`);
        } catch (e) {
            results.push(`${task.name}: 请求失败 ${e.message}`);
        }
    }
    $.notify("汽水音乐", "任务执行结果", results.join("\n"));
    $done();
}

run();
