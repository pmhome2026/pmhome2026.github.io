(() => {
    "use strict";

    const VERSION = "pm-index-gate-v3.0";

    const DB_NAME = "pm-knowledge-device";
    const DB_VERSION = 1;
    const STORE_NAME = "keys";
    const RECORD_KEY = "device-keypair-v1";

    function bytesToBase64(buffer) {
        const bytes = new Uint8Array(buffer);

        let binary = "";
        const chunk = 0x8000;

        for (
            let i = 0;
            i < bytes.length;
            i += chunk
        ) {
            binary += String.fromCharCode(
                ...bytes.subarray(
                    i,
                    i + chunk
                )
            );
        }

        return btoa(binary);
    }

    function base64ToBytes(b64) {
        const binary = atob(b64);

        const bytes =
            new Uint8Array(
                binary.length
            );

        for (
            let i = 0;
            i < binary.length;
            i++
        ) {
            bytes[i] =
                binary.charCodeAt(i);
        }

        return bytes;
    }

    function bytesToHex(buffer) {
        return [
            ...new Uint8Array(buffer)
        ]
            .map(
                b =>
                    b
                        .toString(16)
                        .padStart(2, "0")
            )
            .join("");
    }

    function formatDeviceId(hex) {
        const short =
            hex
                .slice(0, 16)
                .toUpperCase();

        return (
            "PM-" +
            short.slice(0, 4) +
            "-" +
            short.slice(4, 8) +
            "-" +
            short.slice(8, 12) +
            "-" +
            short.slice(12, 16)
        );
    }

    function openDb() {
        return new Promise(
            (resolve, reject) => {

                const request =
                    indexedDB.open(
                        DB_NAME,
                        DB_VERSION
                    );

                request.onupgradeneeded =
                    () => {

                        const db =
                            request.result;

                        if (
                            !db.objectStoreNames
                                .contains(
                                    STORE_NAME
                                )
                        ) {
                            db.createObjectStore(
                                STORE_NAME
                            );
                        }
                    };

                request.onsuccess =
                    () =>
                        resolve(
                            request.result
                        );

                request.onerror =
                    () =>
                        reject(
                            request.error
                        );
            }
        );
    }

    async function dbGet(key) {
        const db =
            await openDb();

        return new Promise(
            (resolve, reject) => {

                const tx =
                    db.transaction(
                        STORE_NAME,
                        "readonly"
                    );

                const request =
                    tx
                        .objectStore(
                            STORE_NAME
                        )
                        .get(key);

                request.onsuccess =
                    () =>
                        resolve(
                            request.result ||
                            null
                        );

                request.onerror =
                    () =>
                        reject(
                            request.error
                        );

                tx.oncomplete =
                    () =>
                        db.close();
            }
        );
    }

    async function dbPut(
        key,
        value
    ) {
        const db =
            await openDb();

        return new Promise(
            (resolve, reject) => {

                const tx =
                    db.transaction(
                        STORE_NAME,
                        "readwrite"
                    );

                tx
                    .objectStore(
                        STORE_NAME
                    )
                    .put(
                        value,
                        key
                    );

                tx.oncomplete =
                    () => {
                        db.close();
                        resolve();
                    };

                tx.onerror =
                    () => {
                        db.close();

                        reject(
                            tx.error
                        );
                    };
            }
        );
    }

    async function createIdentity() {
        const pair =
            await crypto.subtle
                .generateKey(
                    {
                        name:
                            "RSA-OAEP",

                        modulusLength:
                            2048,

                        publicExponent:
                            new Uint8Array(
                                [1, 0, 1]
                            ),

                        hash:
                            "SHA-256"
                    },

                    true,

                    [
                        "encrypt",
                        "decrypt"
                    ]
                );

        const publicSpki =
            await crypto.subtle
                .exportKey(
                    "spki",
                    pair.publicKey
                );

        const privatePkcs8 =
            await crypto.subtle
                .exportKey(
                    "pkcs8",
                    pair.privateKey
                );

        const privateKey =
            await crypto.subtle
                .importKey(
                    "pkcs8",
                    privatePkcs8,

                    {
                        name:
                            "RSA-OAEP",

                        hash:
                            "SHA-256"
                    },

                    false,

                    [
                        "decrypt"
                    ]
                );

        const fingerprint =
            await crypto.subtle
                .digest(
                    "SHA-256",
                    publicSpki
                );

        const record = {
            version: 1,

            createdAt:
                new Date()
                    .toISOString(),

            privateKey,

            publicKeySpkiBase64:
                bytesToBase64(
                    publicSpki
                ),

            deviceId:
                formatDeviceId(
                    bytesToHex(
                        fingerprint
                    )
                )
        };

        await dbPut(
            RECORD_KEY,
            record
        );

        return record;
    }

    async function loadIdentity() {
        if (
            !window.isSecureContext ||
            !window.crypto?.subtle ||
            !window.indexedDB
        ) {
            throw new Error(
                "当前浏览器不支持安全设备授权。"
            );
        }

        let record =
            await dbGet(
                RECORD_KEY
            );

        if (
            !record ||
            !record.privateKey ||
            !record.deviceId ||
            !record.publicKeySpkiBase64
        ) {
            record =
                await createIdentity();
        }

        return record;
    }

    async function decryptLicense(
        record,
        license
    ) {
        if (
            license.license_version
            !== 3
        ) {
            throw new Error(
                "License 版本不是 V3。"
            );
        }

        if (
            license.device_id
            !== record.deviceId
        ) {
            throw new Error(
                "License 与当前设备不匹配。"
            );
        }

        const rawAesKey =
            await crypto.subtle
                .decrypt(
                    {
                        name:
                            "RSA-OAEP"
                    },

                    record.privateKey,

                    base64ToBytes(
                        license
                            .key_wrap
                            .wrapped_key_base64
                    )
                );

        const aesKey =
            await crypto.subtle
                .importKey(
                    "raw",
                    rawAesKey,

                    {
                        name:
                            "AES-GCM"
                    },

                    false,

                    [
                        "decrypt"
                    ]
                );

        const expectedAad =
            record.deviceId +
            "|v3";

        const encrypted =
            license
                .payload_encryption;

        if (
            encrypted.aad
            !== expectedAad
        ) {
            throw new Error(
                "License AAD 校验失败。"
            );
        }

        const plaintext =
            await crypto.subtle
                .decrypt(
                    {
                        name:
                            "AES-GCM",

                        iv:
                            base64ToBytes(
                                encrypted
                                    .nonce_base64
                            ),

                        additionalData:
                            new TextEncoder()
                                .encode(
                                    expectedAad
                                ),

                        tagLength:
                            128
                    },

                    aesKey,

                    base64ToBytes(
                        encrypted
                            .ciphertext_base64
                    )
                );

        const payload =
            JSON.parse(
                new TextDecoder()
                    .decode(
                        plaintext
                    )
            );

        if (
            payload.type
                !==
                "pm-knowledge-device-license" ||

            payload.version
                !== 3 ||

            payload.device_id
                !==
                record.deviceId
        ) {
            throw new Error(
                "License 内容校验失败。"
            );
        }

        if (
            payload.status
            !== "active"
        ) {
            throw new Error(
                "当前设备授权已暂停或撤销。"
            );
        }

        if (
            payload.expires_at
        ) {
            const expiry =
                Date.parse(
                    payload.expires_at
                );

            if (
                !Number.isFinite(
                    expiry
                )
            ) {
                throw new Error(
                    "License 到期时间异常。"
                );
            }

            if (
                Date.now()
                > expiry
            ) {
                throw new Error(
                    "当前设备授权已过期。"
                );
            }
        }

        return payload;
    }

    function createStatusBox() {
        let box =
            document.getElementById(
                "pm-v3-index-status"
            );

        if (box) {
            return box;
        }

        box =
            document.createElement(
                "div"
            );

        box.id =
            "pm-v3-index-status";

        box.style.background =
            "white";

        box.style.border =
            "1px solid #e2e8f0";

        box.style.borderRadius =
            "10px";

        box.style.padding =
            "14px 16px";

        box.style.marginBottom =
            "20px";

        box.style.lineHeight =
            "1.7";

        const main =
            document.querySelector(
                ".main"
            );

        if (main) {
            main.prepend(box);
        }

        return box;
    }

    function showRegistration(
        record
    ) {
        const box =
            createStatusBox();

        box.innerHTML = "";

        const title =
            document.createElement(
                "strong"
            );

        title.textContent =
            "此设备尚未授权";

        box.appendChild(title);

        const message =
            document.createElement(
                "p"
            );

        message.textContent =
            "请将下面的设备码和设备公钥发送给管理员。";

        box.appendChild(
            message
        );

        const idLabel =
            document.createElement(
                "div"
            );

        idLabel.textContent =
            "设备码：";

        const id =
            document.createElement(
                "code"
            );

        id.textContent =
            record.deviceId;

        idLabel.appendChild(id);

        box.appendChild(
            idLabel
        );

        const key =
            document.createElement(
                "textarea"
            );

        key.readOnly = true;

        key.value =
            record
                .publicKeySpkiBase64;

        key.style.width =
            "100%";

        key.style.minHeight =
            "100px";

        key.style.marginTop =
            "12px";

        box.appendChild(
            key
        );
    }

    function showError(
        message
    ) {
        const box =
            createStatusBox();

        box.textContent =
            message;

        box.style.background =
            "#fff1f0";

        box.style.color =
            "#cf222e";
    }

    function showAuthorized(
        payload,
        count
    ) {
        const box =
            createStatusBox();

        const plan =
            payload.plan ||
            "custom";

        const expiry =
            payload.expires_at
                ? payload.expires_at
                : "长期";

        box.textContent =
            "设备授权正常 · " +
            "套餐：" +
            plan +
            " · 可访问资料：" +
            count +
            " · 到期：" +
            expiry;
    }

    async function boot() {
        console.log(
            "[pm-index-v3]",
            VERSION
        );

        const cards = [
            ...document
                .querySelectorAll(
                    ".card[data-pm-resource-id]"
                )
        ];

        try {
            const record =
                await loadIdentity();

            const url =
                "/licenses-v3/" +
                encodeURIComponent(
                    record.deviceId
                ) +
                ".json?v=" +
                Date.now();

            let response;

            try {
                response =
                    await fetch(
                        url,
                        {
                            cache:
                                "no-store"
                        }
                    );
            }
            catch {
                throw new Error(
                    "暂时无法连接授权服务器。"
                );
            }

            if (
                response.status
                === 404
            ) {
                showRegistration(
                    record
                );

                return;
            }

            if (
                !response.ok
            ) {
                throw new Error(
                    "授权检查失败，HTTP " +
                    response.status
                );
            }

            const license =
                await response.json();

            const payload =
                await decryptLicense(
                    record,
                    license
                );

            const resourceKeys =
                payload.resource_keys ||
                {};

            const allowed =
                new Set(
                    Object.keys(
                        resourceKeys
                    )
                );

            let visible = 0;

            for (
                const card
                of cards
            ) {
                const resourceId =
                    card.dataset
                        .pmResourceId;

                if (
                    allowed.has(
                        resourceId
                    )
                ) {
                    card.hidden =
                        false;

                    visible += 1;
                }
            }

            /*
             * The index only needs permission membership.
             * It does not need actual content passwords.
             * Clear them immediately after creating
             * the allowed-resource set.
             */
            for (
                const resource
                of Object.values(
                    resourceKeys
                )
            ) {
                if (
                    resource &&
                    typeof resource
                        === "object"
                ) {
                    resource.content_key =
                        "";
                }
            }

            showAuthorized(
                payload,
                visible
            );
        }
        catch (error) {
            console.error(
                error
            );

            showError(
                String(
                    error?.message ||
                    error
                )
            );
        }
    }

    if (
        document.readyState
        === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            boot
        );
    }
    else {
        boot();
    }
})();
