// Endpoints de l'API admin utilisés par la console (voir kaskad-backend/README.md).
import { downloadFile, request, upload } from "./client";

export const api = {
    // Authentification
    // Réponse : session, ou { mfa_required, mfa_token } quand la double authentification est activée
    login: (email, password) => request("/admin/auth/login", { method: "POST", body: { email, password } }),
    loginMfa: (mfa_token, code) => request("/admin/auth/login/2fa", { method: "POST", body: { mfa_token, code } }),

    // Double authentification (TOTP + codes de secours)
    mfaStatus: () => request("/admin/auth/2fa"),
    mfaSetup: (password) => request("/admin/auth/2fa/setup", { method: "POST", body: { password } }),
    mfaEnable: (code) => request("/admin/auth/2fa/enable", { method: "POST", body: { code } }),
    mfaDisable: (password, code) => request("/admin/auth/2fa/disable", { method: "POST", body: { password, code } }),
    mfaRecoveryCodes: (code) => request("/admin/auth/2fa/recovery-codes", { method: "POST", body: { code } }),
    resetMemberMfa: (id) => request(`/admin/members/${id}/reset-2fa`, { method: "POST" }),
    setRequire2fa: (require_2fa) => request("/admin/account", { method: "PATCH", body: { require_2fa } }),
    logout: (refresh_token) => request("/admin/auth/logout", { method: "POST", body: { refresh_token } }),
    me: () => request("/admin/auth/me"),
    updateMe: (body) => request("/admin/auth/me", { method: "PATCH", body }),

    // Inscription (compte développeur) et confirmation d'e-mail
    signup: (body) => request("/admin/auth/signup", { method: "POST", body }),
    verifyEmail: (token) => request("/admin/auth/verify-email", { method: "POST", body: { token } }),
    resendVerification: (email) => request("/admin/auth/resend-verification", { method: "POST", body: { email } }),
    forgotPassword: (email) => request("/admin/auth/forgot-password", { method: "POST", body: { email } }),
    resetPassword: (token, password) => request("/admin/auth/reset-password", { method: "POST", body: { token, password } }),

    // Compte développeur, membres et invitations
    renameAccount: (name) => request("/admin/account", { method: "PATCH", body: { name } }),
    accounts: () => request("/admin/accounts"),
    suspendAccount: (id, suspended, reason) => request(`/admin/accounts/${id}`, { method: "PATCH", body: { suspended, reason } }),
    members: (accountId) => request("/admin/members", { params: { account_id: accountId } }),
    updateMember: (id, body) => request(`/admin/members/${id}`, { method: "PATCH", body }),
    apiKeys: () => request("/admin/api-keys"),
    createApiKey: (name) => request("/admin/api-keys", { method: "POST", body: { name } }),
    revokeApiKey: (id) => request(`/admin/api-keys/${id}`, { method: "DELETE" }),
    invitations: () => request("/admin/invitations"),
    invite: (email, role) => request("/admin/invitations", { method: "POST", body: { email, role } }),
    resendInvitation: (id) => request(`/admin/invitations/${id}/resend`, { method: "POST" }),
    revokeInvitation: (id) => request(`/admin/invitations/${id}`, { method: "DELETE" }),
    lookupInvitation: (token) => request("/admin/invitations/lookup", { params: { token } }),
    acceptInvitation: (body) => request("/admin/invitations/accept", { method: "POST", body }),

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
    setTesters: (id, emails) => request(`/admin/apps/${id}/testers`, { method: "PUT", body: { emails } }),

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
    // Publication (immédiate ou programmée à `publish_at`) ; bêta en ligne → passage en production
    publishVersion: (id, publish_at) => request(`/admin/versions/${id}/publish`, { method: "POST", body: { publish_at: publish_at || null } }),
    unscheduleVersion: (id) => request(`/admin/versions/${id}/unschedule`, { method: "POST" }),
    archiveVersion: (id) => request(`/admin/versions/${id}/archive`, { method: "POST" }),
    rescanVersion: (id) => request(`/admin/versions/${id}/rescan`, { method: "POST" }),
    submitVersion: (id, note, publish_at) => request(`/admin/versions/${id}/submit`, { method: "POST", body: { note, publish_at: publish_at || null } }),
    rejectVersion: (id, reason) => request(`/admin/versions/${id}/reject`, { method: "POST", body: { reason } }),
    withdrawVersion: (id) => request(`/admin/versions/${id}/submission`, { method: "DELETE" }),
    versionDownloadUrl: (id) => request(`/admin/versions/${id}/download-url`),

    // Statistiques, modération, activité
    overview: () => request("/admin/stats/overview"),
    downloads: (params) => request("/admin/stats/downloads", { params }),
    breakdown: (params) => request("/admin/stats/breakdown", { params }),
    // Vues de fiche, visiteurs, téléchargements, conversion ; versions réellement installées
    funnel: (params) => request("/admin/stats/funnel", { params }),
    installed: (params) => request("/admin/stats/installed", { params }),
    topApps: (params) => request("/admin/stats/top-apps", { params }),
    exportCsv: (params) => downloadFile("/admin/stats/export.csv", params, "kaskad-downloads.csv"),
    moderationQueue: () => request("/admin/moderation/queue"),
    moderationReviews: () => request("/admin/moderation/reviews"),
    activity: (params) => request("/admin/activity", { params }),

    // Notes et avis des utilisateurs, signalements
    appReviews: (appId, params) => request(`/admin/apps/${appId}/reviews`, { params }),
    replyReview: (id, body) => request(`/admin/reviews/${id}/reply`, { method: "PUT", body: { body } }),
    deleteReply: (id) => request(`/admin/reviews/${id}/reply`, { method: "DELETE" }),
    hideReview: (id, reason) => request(`/admin/reviews/${id}/hide`, { method: "POST", body: { reason } }),
    restoreReview: (id) => request(`/admin/reviews/${id}/restore`, { method: "POST" }),
    reviewsSummary: () => request("/admin/reviews-summary"),
    moderationUserReviews: (filter) => request("/admin/moderation/user-reviews", { params: { filter } }),
    moderationReports: (status) => request("/admin/moderation/reports", { params: { status } }),
    resolveReport: (id, body) => request(`/admin/reports/${id}/resolve`, { method: "POST", body }),
};
