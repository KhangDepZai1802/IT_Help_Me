SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict uZwVwYenbpT2BXv84CKRPpmYWfUePqbvbUPKlax8ppuWuQVGluzXQfnOPeEUnyb

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at", "custom_claims_allowlist") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."Department" ("id", "name", "isActive", "createdAt") FROM stdin;
dept-accounting	Kế toán	t	2026-07-08 08:02:15.788
dept-hr	Nhân sự	t	2026-07-08 08:02:16.579
dept-marketing	Marketing	t	2026-07-08 08:02:16.688
dept-sales	Kinh doanh	t	2026-07-08 08:02:16.796
dept-warehouse	Kho vận	t	2026-07-08 08:02:16.906
dept-1783561002284	Nhân viên PG	t	2026-07-09 01:36:42.982
\.


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."Account" ("id", "username", "passwordHash", "role", "departmentId", "createdAt") FROM stdin;
\.


--
-- Data for Name: ChatMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."ChatMessage" ("id", "departmentId", "senderRole", "senderName", "content", "sentAt", "readAt") FROM stdin;
\.


--
-- Data for Name: ITStaff; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."ITStaff" ("id", "fullName", "isActive", "createdAt") FROM stdin;
it-1783481180667	Khang	t	2026-07-08 08:12:31.513
it-1783481185169	Doanh	t	2026-07-08 08:12:31.696
it-1783481189081	Phú	t	2026-07-08 08:12:31.878
it-1783481203117	A Cường (Trưởng phòng)	t	2026-07-08 08:12:32.06
\.


--
-- Data for Name: Request; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."Request" ("id", "departmentId", "requesterName", "content", "priority", "status", "assignedToId", "resolutionNote", "attachmentName", "rating", "createdAt", "updatedAt") FROM stdin;
REQ-260710-753	dept-accounting	Nguyễn Thị Như Quỳnh	cập nhật thông tin SĐT kế toán bán hàng 0903 947 941	MEDIUM	DONE	it-1783481203117	Xong		5	2026-07-10 01:42:41.287	2026-07-10 04:03:07.896
REQ-260709-710	dept-accounting	NGUYỄN THỊ NHƯ QUỲNH	1. Nhờ em kiểm tra anh Lộc là thấy ảnh di chuyển nhiều, nhưng sao số km ít, MCP\nNhận bàn giao sim anh Sĩ Miền đông +Trọng miền tây	MEDIUM	DONE	it-1783481203117	xong		5	2026-07-09 03:36:03.3	2026-07-10 04:03:11.215
REQ-260710-396	dept-accounting	Trân	Xuống xem dùm wifi Thống đạt b2 bị gì ko kết nối được á	MEDIUM	DONE	it-1783481203117	xong		5	2026-07-10 01:17:20.223	2026-07-10 04:03:13.179
REQ-260709-559	dept-accounting	NGUYỄN DƯƠNG NGỌC THIÊN QUÍ	HÔM NAY NGÀY 09/07/2026 VÀO LÚC 7H52 CHẤM CÔNG MÁY VÂN TAY BỊ LỖI, NHỜ BỘ PHẬN IT CẬP NHẬT CHẤM CÔNG CHO NGUYỄN DƯƠNG NGỌC THIÊN QUÍ GIÚP, CẢM ƠN!	URGENT	DONE	it-1783481203117	Xong		5	2026-07-09 06:45:41.576	2026-07-10 04:03:15.065
REQ-260709-399	dept-accounting	NGUYỄN THỊ NHƯ QUỲNH	BẢNG LƯƠNG của Trần Hữu Hiếu có phải là của Lê Thanh Lộc không?	MEDIUM	DONE	it-1783481203117	Mã anh Lộc là, chị Lệ đang để là KD-MT5-002(của a Hiếu)		5	2026-07-09 03:52:43.761	2026-07-10 04:03:17.599
REQ-260709-752	dept-accounting	Chị Tuyền	Nhờ IT kiểm trả excel máy tính chị ko dùng đc.	URGENT	DONE	it-1783481203117	Xong		5	2026-07-09 02:27:07.842	2026-07-10 04:03:19.937
REQ-260709-575	dept-accounting	Chị Cẩm-phòng kế toán	Hỗ trợ chỉnh máy tính kết nối máy in	MEDIUM	DONE	it-1783481203117	Xong		5	2026-07-09 02:22:24.61	2026-07-10 04:03:22.051
REQ-260709-729	dept-sales	Nguyễn Trần Hoàn Thiện	Cần bàn giao tuyến bán hàng tháng 7 cho khu vực Bình Dương	MEDIUM	DONE	it-1783481189081	xong		5	2026-07-09 04:04:31.003	2026-07-10 04:03:49.605
REQ-260710-502	dept-1783561002284	Nguyễn Thị Lệ Quyên	Em là nhân viên pg vừa full time vừa part time. Em ko thể chấm công bên app mới được ạ. Chị giúp em điều chỉnh sớm để em làm quen hơn nha	URGENT	DONE	it-1783481185169	đã ok		\N	2026-07-10 06:07:50.96	2026-07-10 07:11:26.234
REQ-260713-275	dept-accounting	Trần Thị Bảo Trân	Hướng dẫn Chị Quỳnh lọc danh số theo từng tháng của từng khách hàng	MEDIUM	DONE	it-1783481203117	Xong		\N	2026-07-13 07:08:11.88	2026-07-13 07:17:05.207
\.


--
-- Data for Name: RequestAttachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."RequestAttachment" ("id", "requestId", "fileUrl", "fileName", "uploadedAt") FROM stdin;
\.


--
-- Data for Name: RequestStatusHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."RequestStatusHistory" ("id", "requestId", "oldStatus", "newStatus", "changedById", "note", "changedAt") FROM stdin;
REQ-260709-575-history-new	REQ-260709-575	\N	NEW	\N	Tạo yêu cầu	2026-07-09 02:22:24.61
REQ-260709-575-history-2026-07-09T02:22:56.116Z	REQ-260709-575	NEW	DONE	it-1783481203117	Xong	2026-07-09 02:22:56.116
REQ-260709-752-history-new	REQ-260709-752	\N	NEW	\N	Tạo yêu cầu	2026-07-09 02:27:07.842
REQ-260709-752-history-2026-07-09T02:38:52.719Z	REQ-260709-752	NEW	ACCEPTED	it-1783481203117	Cập nhật trạng thái	2026-07-09 02:38:52.719
REQ-260709-752-history-2026-07-09T02:47:38.205Z	REQ-260709-752	ACCEPTED	DONE	it-1783481203117	Xong	2026-07-09 02:47:38.205
REQ-260709-710-history-new	REQ-260709-710	\N	NEW	\N	Tạo yêu cầu	2026-07-09 03:36:03.3
REQ-260709-710-history-2026-07-09T03:42:39.897Z	REQ-260709-710	NEW	ACCEPTED	it-1783481203117	Cập nhật trạng thái	2026-07-09 03:42:39.897
REQ-260709-399-history-new	REQ-260709-399	\N	NEW	\N	Tạo yêu cầu	2026-07-09 03:52:43.761
REQ-260709-399-history-2026-07-09T03:57:57.678Z	REQ-260709-399	NEW	ACCEPTED	it-1783481203117	Cập nhật trạng thái	2026-07-09 03:57:57.678
REQ-260709-399-history-2026-07-09T04:04:14.909Z	REQ-260709-399	ACCEPTED	DONE	it-1783481203117	Mã anh Lộc là, chị Lệ đang để là KD-MT5-002(của a Hiếu)	2026-07-09 04:04:14.909
REQ-260709-729-history-new	REQ-260709-729	\N	NEW	\N	Tạo yêu cầu	2026-07-09 04:04:31.003
REQ-260709-729-history-2026-07-09T04:39:15.093Z	REQ-260709-729	NEW	IN_PROGRESS	it-1783481189081	Cập nhật trạng thái	2026-07-09 04:39:15.093
REQ-260709-729-history-2026-07-09T04:47:07.663Z	REQ-260709-729	IN_PROGRESS	DONE	it-1783481189081	xong	2026-07-09 04:47:07.663
REQ-260709-559-history-new	REQ-260709-559	\N	NEW	\N	Tạo yêu cầu	2026-07-09 06:45:41.576
REQ-260709-559-history-2026-07-09T08:12:41.593Z	REQ-260709-559	NEW	ACCEPTED	it-1783481203117	Cập nhật trạng thái	2026-07-09 08:12:41.593
REQ-260709-559-history-2026-07-09T08:24:40.382Z	REQ-260709-559	ACCEPTED	DONE	it-1783481203117	Xong	2026-07-09 08:24:40.382
REQ-260709-710-history-2026-07-09T08:27:06.271Z	REQ-260709-710	ACCEPTED	IN_PROGRESS	it-1783481203117	Cập nhật trạng thái	2026-07-09 08:27:06.271
REQ-260710-396-history-new	REQ-260710-396	\N	NEW	\N	Tạo yêu cầu	2026-07-10 01:17:20.223
REQ-260710-396-history-2026-07-10T01:28:29.691Z	REQ-260710-396	NEW	DONE	it-1783481203117	xong	2026-07-10 01:28:29.691
REQ-260709-710-history-2026-07-10T01:28:41.981Z	REQ-260709-710	IN_PROGRESS	DONE	it-1783481203117	xong	2026-07-10 01:28:41.981
REQ-260710-753-history-new	REQ-260710-753	\N	NEW	\N	Tạo yêu cầu	2026-07-10 01:42:41.287
REQ-260710-753-history-2026-07-10T02:29:46.470Z	REQ-260710-753	NEW	DONE	it-1783481203117	Xong	2026-07-10 02:29:46.47
REQ-260710-502-history-new	REQ-260710-502	\N	NEW	\N	Tạo yêu cầu	2026-07-10 06:07:50.96
REQ-260710-502-history-2026-07-10T06:49:07.803Z	REQ-260710-502	NEW	ACCEPTED	it-1783481185169	Cập nhật trạng thái	2026-07-10 06:49:07.803
REQ-260710-502-history-2026-07-10T06:49:39.128Z	REQ-260710-502	ACCEPTED	IN_PROGRESS	it-1783481185169	Cập nhật trạng thái	2026-07-10 06:49:39.128
REQ-260710-502-history-2026-07-10T07:11:26.234Z	REQ-260710-502	IN_PROGRESS	DONE	it-1783481185169	đã ok	2026-07-10 07:11:26.234
REQ-260713-275-history-new	REQ-260713-275	\N	NEW	\N	Tạo yêu cầu	2026-07-13 07:08:11.88
REQ-260713-275-history-2026-07-13T07:09:20.243Z	REQ-260713-275	NEW	ACCEPTED	\N	Cập nhật trạng thái	2026-07-13 07:09:20.243
REQ-260713-275-history-2026-07-13T07:17:05.207Z	REQ-260713-275	ACCEPTED	DONE	it-1783481203117	Xong	2026-07-13 07:17:05.207
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
it-help-me-attachments	it-help-me-attachments	\N	2026-07-08 08:32:39.743556+00	2026-07-08 08:32:39.743556+00	f	f	10485760	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_vectors" ("id", "type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."vector_indexes" ("id", "name", "bucket_id", "data_type", "dimension", "distance_metric", "metadata_configuration", "created_at", "updated_at") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict uZwVwYenbpT2BXv84CKRPpmYWfUePqbvbUPKlax8ppuWuQVGluzXQfnOPeEUnyb

RESET ALL;
