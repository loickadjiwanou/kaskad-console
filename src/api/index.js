// Endpoints de l'API admin utilisés par la console (voir kaskad-backend/README.md).
import { downloadFile, request, upload } from "./client";

export const api = {
    // Authentification
    login: (email, password) => request("/admin/auth/login", { method: "POST", body: { email, password } }),
    logout: (refresh_token) => request("/admin/auth/logout", { method: "POST", body: { refresh_token } }),
    me: () => request("/admin/auth/me"),
    updateMe: (body) => request("/admin/auth/me", { method: "PATCH", body }),

    // Équipe
    admins: () => request("/admin/admins"),
    createAdmin: (body) => request("/admin/admins", { method: "POST", body }),
    updateAdmin: (id, body) => request(`/admin/admins/${id}`, { method: "PATCH", body }),

    // Catégories
    categories: () => request("/admin/categories"),
    createCategory: (body) => request("/admin/categories", { method: "POST", body }),
    updateCategory: (id, body) => request(`/admin/categories/${id}`, { method: "PATCH", body }),
    deleteCategory: (id, reassign_to) => request(`/admin/categories/${id}`, { method: "DELETE", params: { reassign_to } }),
    reorderCategories: (ids) => request("/admin/categories/order", { method: "PUT", body: { ids } }),
    reassignCategory: (id, to_category_id, app_ids) =>
        request(`/admin/categories/${id}/reassign`, { method: "POST", body: { to_category_id, app_ids } }),

    // Applications
    apps: (params) => request("/admin/apps", { params }),
    app: (id) => request(`/admin/apps/${id}`),
    createApp: (body) => request("/admin/apps", { method: "POST", body }),
    updateApp: (id, body) => request(`/admin/apps/${id}`, { method: "PATCH", body }),
    setAppStatus: (id, status) => request(`/admin/apps/${id}/status`, { method: "POST", body: { status } }),
    preview: (id, draft = false) => request(`/admin/apps/${id}/preview`, { params: { draft: draft || undefined } }),
    uploadIcon: (id, file, onProgress) => {
        const form = new FormData();
        form.append("file", file);
        return upload(`/admin/apps/${id}/icon`, form, { onProgress });
    },
    addScreenshots: (id, files, onProgress) => {
        const form = new FormData();
        files.forEach((f) => form.append("files", f));
        return upload(`/admin/apps/${id}/screenshots`, form, { onProgress });
    },
    setScreenshots: (id, urls) => request(`/admin/apps/${id}/screenshots`, { method: "PUT", body: { urls } }),

    // Circuit de validation (les éditeurs soumettent, les admins complets valident)
    requestStatus: (id, status, note) => request(`/admin/apps/${id}/status-request`, { method: "POST", body: { status, note } }),
    approveStatusRequest: (id) => request(`/admin/apps/${id}/status-request/approve`, { method: "POST" }),
    rejectStatusRequest: (id, reason) => request(`/admin/apps/${id}/status-request/reject`, { method: "POST", body: { reason } }),
    withdrawStatusRequest: (id) => request(`/admin/apps/${id}/status-request`, { method: "DELETE" }),
    submitListing: (id, note) => request(`/admin/apps/${id}/listing/submit`, { method: "POST", body: { note } }),
    publishListing: (id) => request(`/admin/apps/${id}/listing/publish`, { method: "POST" }),
    rejectListing: (id, reason) => request(`/admin/apps/${id}/listing/reject`, { method: "POST", body: { reason } }),
    withdrawListingReview: (id) => request(`/admin/apps/${id}/listing/review`, { method: "DELETE" }),
    discardListing: (id) => request(`/admin/apps/${id}/listing`, { method: "DELETE" }),

    // Versions
    versions: (appId) => request(`/admin/apps/${appId}/versions`),
    version: (id) => request(`/admin/versions/${id}`),
    uploadVersion: (appId, fields, file, onProgress) => {
        const form = new FormData();
        Object.entries(fields).forEach(([k, v]) => form.append(k, v ?? ""));
        form.append("file", file);
        return upload(`/admin/apps/${appId}/versions`, form, { onProgress });
    },
    updateVersion: (id, body) => request(`/admin/versions/${id}`, { method: "PATCH", body }),
    publishVersion: (id) => request(`/admin/versions/${id}/publish`, { method: "POST" }),
    archiveVersion: (id) => request(`/admin/versions/${id}/archive`, { method: "POST" }),
    rescanVersion: (id) => request(`/admin/versions/${id}/rescan`, { method: "POST" }),
    submitVersion: (id, note) => request(`/admin/versions/${id}/submit`, { method: "POST", body: { note } }),
    rejectVersion: (id, reason) => request(`/admin/versions/${id}/reject`, { method: "POST", body: { reason } }),
    withdrawVersion: (id) => request(`/admin/versions/${id}/submission`, { method: "DELETE" }),
    versionDownloadUrl: (id) => request(`/admin/versions/${id}/download-url`),

    // Statistiques, modération, activité
    overview: () => request("/admin/stats/overview"),
    downloads: (params) => request("/admin/stats/downloads", { params }),
    breakdown: (params) => request("/admin/stats/breakdown", { params }),
    topApps: (params) => request("/admin/stats/top-apps", { params }),
    exportCsv: (params) => downloadFile("/admin/stats/export.csv", params, "kaskad-downloads.csv"),
    moderationQueue: () => request("/admin/moderation/queue"),
    moderationReviews: () => request("/admin/moderation/reviews"),
    activity: (params) => request("/admin/activity", { params }),
};
