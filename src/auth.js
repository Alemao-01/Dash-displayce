export async function loginDisplayCE(env) {
    const params = new URLSearchParams();
    params.append('username', env.DISPLAYCE_USER);
    params.append('password', env.DISPLAYCE_PASSWORD);

    console.log("🔑 Tentando login na DisplayCE...");

    const response = await fetch("https://datahub.displayce.com/agencies/v2/rtb/reports/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString()
    });

    if (response.ok) {
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            console.log("✅ Login realizado com sucesso.");
            return json.token || json.key || text;
        } catch (e) {
            console.log("✅ Login realizado (Token raw).");
            return text;
        }
    }
    console.error("❌ Erro no login:", response.status, await response.text());
    return null;
}
