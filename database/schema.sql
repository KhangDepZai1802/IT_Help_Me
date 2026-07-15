


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."AccountRole" AS ENUM (
    'DEPARTMENT',
    'IT'
);


ALTER TYPE "public"."AccountRole" OWNER TO "postgres";


CREATE TYPE "public"."Priority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE "public"."Priority" OWNER TO "postgres";


CREATE TYPE "public"."RequestStatus" AS ENUM (
    'NEW',
    'ACCEPTED',
    'IN_PROGRESS',
    'DONE',
    'REJECTED'
);


ALTER TYPE "public"."RequestStatus" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Account" (
    "id" "text" NOT NULL,
    "username" "text" NOT NULL,
    "passwordHash" "text" NOT NULL,
    "role" "public"."AccountRole" NOT NULL,
    "departmentId" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."Account" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ChatMessage" (
    "id" "text" NOT NULL,
    "departmentId" "text" NOT NULL,
    "senderRole" "public"."AccountRole" NOT NULL,
    "senderName" "text" NOT NULL,
    "content" "text" NOT NULL,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readAt" timestamp(3) without time zone
);


ALTER TABLE "public"."ChatMessage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Department" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."Department" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ITStaff" (
    "id" "text" NOT NULL,
    "fullName" "text" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."ITStaff" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Request" (
    "id" "text" NOT NULL,
    "departmentId" "text" NOT NULL,
    "requesterName" "text" NOT NULL,
    "content" "text" NOT NULL,
    "priority" "public"."Priority" DEFAULT 'MEDIUM'::"public"."Priority" NOT NULL,
    "status" "public"."RequestStatus" DEFAULT 'NEW'::"public"."RequestStatus" NOT NULL,
    "assignedToId" "text",
    "resolutionNote" "text",
    "attachmentName" "text" DEFAULT ''::"text" NOT NULL,
    "rating" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE "public"."Request" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."RequestAttachment" (
    "id" "text" NOT NULL,
    "requestId" "text" NOT NULL,
    "fileUrl" "text" NOT NULL,
    "fileName" "text" NOT NULL,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."RequestAttachment" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."RequestStatusHistory" (
    "id" "text" NOT NULL,
    "requestId" "text" NOT NULL,
    "oldStatus" "public"."RequestStatus",
    "newStatus" "public"."RequestStatus" NOT NULL,
    "changedById" "text",
    "note" "text",
    "changedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."RequestStatusHistory" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ChatMessage"
    ADD CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ITStaff"
    ADD CONSTRAINT "ITStaff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."RequestAttachment"
    ADD CONSTRAINT "RequestAttachment_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."RequestStatusHistory"
    ADD CONSTRAINT "RequestStatusHistory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Request"
    ADD CONSTRAINT "Request_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "Account_username_key" ON "public"."Account" USING "btree" ("username");



CREATE INDEX "ChatMessage_departmentId_sentAt_idx" ON "public"."ChatMessage" USING "btree" ("departmentId", "sentAt");



CREATE INDEX "ChatMessage_senderRole_readAt_idx" ON "public"."ChatMessage" USING "btree" ("senderRole", "readAt");



CREATE UNIQUE INDEX "Department_name_key" ON "public"."Department" USING "btree" ("name");



ALTER TABLE ONLY "public"."Account"
    ADD CONSTRAINT "Account_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ChatMessage"
    ADD CONSTRAINT "ChatMessage_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."RequestAttachment"
    ADD CONSTRAINT "RequestAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."Request"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."RequestStatusHistory"
    ADD CONSTRAINT "RequestStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."ITStaff"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."RequestStatusHistory"
    ADD CONSTRAINT "RequestStatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."Request"("id") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."Request"
    ADD CONSTRAINT "Request_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."ITStaff"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Request"
    ADD CONSTRAINT "Request_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON UPDATE CASCADE ON DELETE RESTRICT;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





































































































































































GRANT ALL ON TABLE "public"."Account" TO "anon";
GRANT ALL ON TABLE "public"."Account" TO "authenticated";
GRANT ALL ON TABLE "public"."Account" TO "service_role";



GRANT ALL ON TABLE "public"."ChatMessage" TO "anon";
GRANT ALL ON TABLE "public"."ChatMessage" TO "authenticated";
GRANT ALL ON TABLE "public"."ChatMessage" TO "service_role";



GRANT ALL ON TABLE "public"."Department" TO "anon";
GRANT ALL ON TABLE "public"."Department" TO "authenticated";
GRANT ALL ON TABLE "public"."Department" TO "service_role";



GRANT ALL ON TABLE "public"."ITStaff" TO "anon";
GRANT ALL ON TABLE "public"."ITStaff" TO "authenticated";
GRANT ALL ON TABLE "public"."ITStaff" TO "service_role";



GRANT ALL ON TABLE "public"."Request" TO "anon";
GRANT ALL ON TABLE "public"."Request" TO "authenticated";
GRANT ALL ON TABLE "public"."Request" TO "service_role";



GRANT ALL ON TABLE "public"."RequestAttachment" TO "anon";
GRANT ALL ON TABLE "public"."RequestAttachment" TO "authenticated";
GRANT ALL ON TABLE "public"."RequestAttachment" TO "service_role";



GRANT ALL ON TABLE "public"."RequestStatusHistory" TO "anon";
GRANT ALL ON TABLE "public"."RequestStatusHistory" TO "authenticated";
GRANT ALL ON TABLE "public"."RequestStatusHistory" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































