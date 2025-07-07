--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agenda_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.agenda_items (
    id integer NOT NULL,
    meeting_id integer NOT NULL,
    submitted_by text NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    submitted_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.agenda_items OWNER TO neondb_owner;

--
-- Name: agenda_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.agenda_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.agenda_items_id_seq OWNER TO neondb_owner;

--
-- Name: agenda_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.agenda_items_id_seq OWNED BY public.agenda_items.id;


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.announcements (
    id integer NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type character varying DEFAULT 'general'::character varying NOT NULL,
    priority character varying DEFAULT 'medium'::character varying NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    link text,
    link_text text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.announcements OWNER TO neondb_owner;

--
-- Name: announcements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.announcements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.announcements_id_seq OWNER TO neondb_owner;

--
-- Name: announcements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.announcements_id_seq OWNED BY public.announcements.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    action character varying NOT NULL,
    table_name character varying NOT NULL,
    record_id character varying NOT NULL,
    old_data text,
    new_data text,
    user_id character varying,
    ip_address character varying,
    user_agent text,
    session_id character varying,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO neondb_owner;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO neondb_owner;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: committee_memberships; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.committee_memberships (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    committee_id character varying NOT NULL,
    role character varying DEFAULT 'member'::character varying NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb,
    joined_at timestamp without time zone DEFAULT now(),
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.committee_memberships OWNER TO neondb_owner;

--
-- Name: committee_memberships_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.committee_memberships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.committee_memberships_id_seq OWNER TO neondb_owner;

--
-- Name: committee_memberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.committee_memberships_id_seq OWNED BY public.committee_memberships.id;


--
-- Name: committees; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.committees (
    id character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.committees OWNER TO neondb_owner;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.contacts (
    id integer NOT NULL,
    name text NOT NULL,
    organization text,
    role text,
    phone text NOT NULL,
    email text,
    address text,
    notes text,
    category text DEFAULT 'general'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.contacts OWNER TO neondb_owner;

--
-- Name: contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.contacts_id_seq OWNER TO neondb_owner;

--
-- Name: contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.contacts_id_seq OWNED BY public.contacts.id;


--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.conversation_participants (
    conversation_id integer NOT NULL,
    user_id text NOT NULL,
    joined_at timestamp without time zone DEFAULT now(),
    last_read_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.conversation_participants OWNER TO neondb_owner;

--
-- Name: conversation_participants_old; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.conversation_participants_old (
    conversation_id integer,
    user_id text,
    joined_at timestamp without time zone,
    last_read_at timestamp without time zone
);


ALTER TABLE public.conversation_participants_old OWNER TO neondb_owner;

--
-- Name: conversation_threads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.conversation_threads (
    id integer NOT NULL,
    type character varying(50) NOT NULL,
    reference_id character varying(100),
    title character varying(200),
    created_by character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_message_at timestamp without time zone
);


ALTER TABLE public.conversation_threads OWNER TO neondb_owner;

--
-- Name: conversation_threads_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.conversation_threads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversation_threads_id_seq OWNER TO neondb_owner;

--
-- Name: conversation_threads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.conversation_threads_id_seq OWNED BY public.conversation_threads.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    type text NOT NULL,
    name text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.conversations OWNER TO neondb_owner;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO neondb_owner;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: conversations_old; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.conversations_old (
    id integer,
    type text,
    name text,
    created_at timestamp without time zone
);


ALTER TABLE public.conversations_old OWNER TO neondb_owner;

--
-- Name: drive_links; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.drive_links (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    url text NOT NULL,
    icon text NOT NULL,
    icon_color text NOT NULL
);


ALTER TABLE public.drive_links OWNER TO neondb_owner;

--
-- Name: drive_links_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.drive_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drive_links_id_seq OWNER TO neondb_owner;

--
-- Name: drive_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.drive_links_id_seq OWNED BY public.drive_links.id;


--
-- Name: driver_agreements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.driver_agreements (
    id integer NOT NULL,
    submitted_by text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    license_number text NOT NULL,
    vehicle_info text NOT NULL,
    emergency_contact text NOT NULL,
    emergency_phone text NOT NULL,
    agreement_accepted boolean DEFAULT false NOT NULL,
    submitted_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.driver_agreements OWNER TO neondb_owner;

--
-- Name: driver_agreements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.driver_agreements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.driver_agreements_id_seq OWNER TO neondb_owner;

--
-- Name: driver_agreements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.driver_agreements_id_seq OWNED BY public.driver_agreements.id;


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.drivers (
    id integer NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    vehicle_type text,
    license_number text,
    availability text DEFAULT 'available'::text,
    zone text,
    route_description text,
    host_location text,
    host_id integer,
    van_approved boolean DEFAULT false NOT NULL,
    home_address text,
    availability_notes text,
    email_agreement_sent boolean DEFAULT false NOT NULL,
    voicemail_left boolean DEFAULT false NOT NULL,
    inactive_reason text
);


ALTER TABLE public.drivers OWNER TO neondb_owner;

--
-- Name: drivers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.drivers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.drivers_id_seq OWNER TO neondb_owner;

--
-- Name: drivers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.drivers_id_seq OWNED BY public.drivers.id;


--
-- Name: google_sheets; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.google_sheets (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    sheet_id character varying NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    embed_url text NOT NULL,
    direct_url text NOT NULL,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.google_sheets OWNER TO neondb_owner;

--
-- Name: google_sheets_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.google_sheets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.google_sheets_id_seq OWNER TO neondb_owner;

--
-- Name: google_sheets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.google_sheets_id_seq OWNED BY public.google_sheets.id;


--
-- Name: group_memberships; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.group_memberships (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id character varying(50) NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    is_active boolean DEFAULT true,
    joined_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.group_memberships OWNER TO neondb_owner;

--
-- Name: group_memberships_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.group_memberships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_memberships_id_seq OWNER TO neondb_owner;

--
-- Name: group_memberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.group_memberships_id_seq OWNED BY public.group_memberships.id;


--
-- Name: group_message_participants; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.group_message_participants (
    id integer NOT NULL,
    thread_id integer NOT NULL,
    user_id character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying,
    joined_at timestamp without time zone DEFAULT now(),
    last_read_at timestamp without time zone,
    left_at timestamp without time zone,
    muted_at timestamp without time zone,
    archived_at timestamp without time zone
);


ALTER TABLE public.group_message_participants OWNER TO neondb_owner;

--
-- Name: group_message_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.group_message_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.group_message_participants_id_seq OWNER TO neondb_owner;

--
-- Name: group_message_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.group_message_participants_id_seq OWNED BY public.group_message_participants.id;


--
-- Name: host_contacts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.host_contacts (
    id integer NOT NULL,
    host_id integer NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    phone text NOT NULL,
    email text,
    is_primary boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.host_contacts OWNER TO neondb_owner;

--
-- Name: host_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.host_contacts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.host_contacts_id_seq OWNER TO neondb_owner;

--
-- Name: host_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.host_contacts_id_seq OWNED BY public.host_contacts.id;


--
-- Name: hosted_files; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.hosted_files (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    file_name text NOT NULL,
    original_name text NOT NULL,
    file_path text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    uploaded_by text NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    download_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hosted_files OWNER TO neondb_owner;

--
-- Name: hosted_files_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.hosted_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hosted_files_id_seq OWNER TO neondb_owner;

--
-- Name: hosted_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.hosted_files_id_seq OWNED BY public.hosted_files.id;


--
-- Name: hosts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.hosts (
    id integer NOT NULL,
    name text NOT NULL,
    address text,
    status text DEFAULT 'active'::text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hosts OWNER TO neondb_owner;

--
-- Name: hosts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.hosts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hosts_id_seq OWNER TO neondb_owner;

--
-- Name: hosts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.hosts_id_seq OWNED BY public.hosts.id;


--
-- Name: meeting_minutes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.meeting_minutes (
    id integer NOT NULL,
    title text NOT NULL,
    date text NOT NULL,
    summary text NOT NULL,
    color text DEFAULT 'blue'::text NOT NULL,
    file_name text,
    file_path text,
    file_type text,
    mime_type text,
    committee_type text
);


ALTER TABLE public.meeting_minutes OWNER TO neondb_owner;

--
-- Name: meeting_minutes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.meeting_minutes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meeting_minutes_id_seq OWNER TO neondb_owner;

--
-- Name: meeting_minutes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.meeting_minutes_id_seq OWNED BY public.meeting_minutes.id;


--
-- Name: meetings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.meetings (
    id integer NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    date text NOT NULL,
    "time" text NOT NULL,
    location text,
    description text,
    final_agenda text,
    status text DEFAULT 'planning'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.meetings OWNER TO neondb_owner;

--
-- Name: meetings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.meetings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.meetings_id_seq OWNER TO neondb_owner;

--
-- Name: meetings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.meetings_id_seq OWNED BY public.meetings.id;


--
-- Name: message_groups; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.message_groups (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    created_by character varying(50) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.message_groups OWNER TO neondb_owner;

--
-- Name: message_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.message_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_groups_id_seq OWNER TO neondb_owner;

--
-- Name: message_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.message_groups_id_seq OWNED BY public.message_groups.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer,
    user_id text NOT NULL,
    content text NOT NULL,
    sender text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.messages OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO neondb_owner;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: messages_old; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.messages_old (
    id integer,
    conversation_id integer,
    user_id text,
    content text,
    sender text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.messages_old OWNER TO neondb_owner;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    type character varying NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    related_type character varying,
    related_id integer,
    celebration_data jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: project_assignments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_assignments (
    id integer NOT NULL,
    project_id integer NOT NULL,
    user_id text NOT NULL,
    role text DEFAULT 'member'::text NOT NULL,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_assignments OWNER TO neondb_owner;

--
-- Name: project_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_assignments_id_seq OWNER TO neondb_owner;

--
-- Name: project_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_assignments_id_seq OWNED BY public.project_assignments.id;


--
-- Name: project_comments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_comments (
    id integer NOT NULL,
    project_id integer NOT NULL,
    author_name text NOT NULL,
    content text NOT NULL,
    comment_type text DEFAULT 'general'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_comments OWNER TO neondb_owner;

--
-- Name: project_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_comments_id_seq OWNER TO neondb_owner;

--
-- Name: project_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_comments_id_seq OWNED BY public.project_comments.id;


--
-- Name: project_documents; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_documents (
    id integer NOT NULL,
    project_id integer NOT NULL,
    file_name text NOT NULL,
    original_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type text NOT NULL,
    uploaded_by text NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_documents OWNER TO neondb_owner;

--
-- Name: project_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_documents_id_seq OWNER TO neondb_owner;

--
-- Name: project_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_documents_id_seq OWNED BY public.project_documents.id;


--
-- Name: project_tasks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_tasks (
    id integer NOT NULL,
    project_id integer NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    assignee_id text,
    assignee_name text,
    assignee_ids text[],
    assignee_names text[],
    due_date text,
    completed_at timestamp without time zone,
    attachments text,
    "order" integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_tasks OWNER TO neondb_owner;

--
-- Name: project_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_tasks_id_seq OWNER TO neondb_owner;

--
-- Name: project_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_tasks_id_seq OWNED BY public.project_tasks.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    status text NOT NULL,
    priority text DEFAULT 'medium'::text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    assignee_id integer,
    assignee_name text,
    assignee_ids jsonb DEFAULT '[]'::jsonb,
    assignee_names text,
    due_date text,
    start_date text,
    completion_date text,
    progress_percentage integer DEFAULT 0 NOT NULL,
    notes text,
    requirements text,
    deliverables text,
    resources text,
    blockers text,
    tags text,
    estimated_hours integer,
    actual_hours integer,
    budget character varying,
    color text DEFAULT 'blue'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.projects OWNER TO neondb_owner;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO neondb_owner;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: recipients; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.recipients (
    id integer NOT NULL,
    name text NOT NULL,
    contact_name text,
    phone text NOT NULL,
    email text,
    address text,
    preferences text,
    weekly_estimate integer,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.recipients OWNER TO neondb_owner;

--
-- Name: recipients_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.recipients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipients_id_seq OWNER TO neondb_owner;

--
-- Name: recipients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.recipients_id_seq OWNED BY public.recipients.id;


--
-- Name: sandwich_collections; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sandwich_collections (
    id integer NOT NULL,
    collection_date text NOT NULL,
    host_name text NOT NULL,
    individual_sandwiches integer NOT NULL,
    group_collections text NOT NULL,
    submitted_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sandwich_collections OWNER TO neondb_owner;

--
-- Name: sandwich_collections_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sandwich_collections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sandwich_collections_id_seq OWNER TO neondb_owner;

--
-- Name: sandwich_collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sandwich_collections_id_seq OWNED BY public.sandwich_collections.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: task_completions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.task_completions (
    id integer NOT NULL,
    task_id integer NOT NULL,
    user_id text NOT NULL,
    user_name text NOT NULL,
    completed_at timestamp without time zone DEFAULT now() NOT NULL,
    notes text
);


ALTER TABLE public.task_completions OWNER TO neondb_owner;

--
-- Name: task_completions_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.task_completions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_completions_id_seq OWNER TO neondb_owner;

--
-- Name: task_completions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.task_completions_id_seq OWNED BY public.task_completions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    password character varying,
    first_name character varying,
    last_name character varying,
    display_name character varying,
    profile_image_url character varying,
    role character varying DEFAULT 'volunteer'::character varying NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: weekly_reports; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.weekly_reports (
    id integer NOT NULL,
    week_ending text NOT NULL,
    sandwich_count integer NOT NULL,
    notes text,
    submitted_by text NOT NULL,
    submitted_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.weekly_reports OWNER TO neondb_owner;

--
-- Name: weekly_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.weekly_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.weekly_reports_id_seq OWNER TO neondb_owner;

--
-- Name: weekly_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.weekly_reports_id_seq OWNED BY public.weekly_reports.id;


--
-- Name: agenda_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.agenda_items ALTER COLUMN id SET DEFAULT nextval('public.agenda_items_id_seq'::regclass);


--
-- Name: announcements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.announcements ALTER COLUMN id SET DEFAULT nextval('public.announcements_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: committee_memberships id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.committee_memberships ALTER COLUMN id SET DEFAULT nextval('public.committee_memberships_id_seq'::regclass);


--
-- Name: contacts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.contacts ALTER COLUMN id SET DEFAULT nextval('public.contacts_id_seq'::regclass);


--
-- Name: conversation_threads id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conversation_threads ALTER COLUMN id SET DEFAULT nextval('public.conversation_threads_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: drive_links id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.drive_links ALTER COLUMN id SET DEFAULT nextval('public.drive_links_id_seq'::regclass);


--
-- Name: driver_agreements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.driver_agreements ALTER COLUMN id SET DEFAULT nextval('public.driver_agreements_id_seq'::regclass);


--
-- Name: drivers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.drivers ALTER COLUMN id SET DEFAULT nextval('public.drivers_id_seq'::regclass);


--
-- Name: google_sheets id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.google_sheets ALTER COLUMN id SET DEFAULT nextval('public.google_sheets_id_seq'::regclass);


--
-- Name: group_memberships id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_memberships ALTER COLUMN id SET DEFAULT nextval('public.group_memberships_id_seq'::regclass);


--
-- Name: group_message_participants id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.group_message_participants ALTER COLUMN id SET DEFAULT nextval('public.group_message_participants_id_seq'::regclass);


--
-- Name: host_contacts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.host_contacts ALTER COLUMN id SET DEFAULT nextval('public.host_contacts_id_seq'::regclass);


--
-- Name: hosted_files id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hosted_files ALTER COLUMN id SET DEFAULT nextval('public.hosted_files_id_seq'::regclass);


--
-- Name: hosts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.hosts ALTER COLUMN id SET DEFAULT nextval('public.hosts_id_seq'::regclass);


--
-- Name: meeting_minutes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meeting_minutes ALTER COLUMN id SET DEFAULT nextval('public.meeting_minutes_id_seq'::regclass);


--
-- Name: meetings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meetings ALTER COLUMN id SET DEFAULT nextval('public.meetings_id_seq'::regclass);


--
-- Name: message_groups id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.message_groups ALTER COLUMN id SET DEFAULT nextval('public.message_groups_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: project_assignments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_assignments ALTER COLUMN id SET DEFAULT nextval('public.project_assignments_id_seq'::regclass);


--
-- Name: project_comments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_comments ALTER COLUMN id SET DEFAULT nextval('public.project_comments_id_seq'::regclass);


--
-- Name: project_documents id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_documents ALTER COLUMN id SET DEFAULT nextval('public.project_documents_id_seq'::regclass);


--
-- Name: project_tasks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_tasks ALTER COLUMN id SET DEFAULT nextval('public.project_tasks_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: recipients id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.recipients ALTER COLUMN id SET DEFAULT nextval('public.recipients_id_seq'::regclass);


--
-- Name: sandwich_collections id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sandwich_collections ALTER COLUMN id SET DEFAULT nextval('public.sandwich_collections_id_seq'::regclass);


--
-- Name: task_completions id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_completions ALTER COLUMN id SET DEFAULT nextval('public.task_completions_id_seq'::regclass);


--
-- Name: weekly_reports id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.weekly_reports ALTER COLUMN id SET DEFAULT nextval('public.weekly_reports_id_seq'::regclass);


--
-- Data for Name: agenda_items; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.agenda_items (id, meeting_id, submitted_by, title, description, status, submitted_at) FROM stdin;
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.announcements (id, title, message, type, priority, start_date, end_date, is_active, link, link_text, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.audit_logs (id, action, table_name, record_id, old_data, new_data, user_id, ip_address, user_agent, session_id, "timestamp") FROM stdin;
\.


--
-- Data for Name: committee_memberships; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.committee_memberships (id, user_id, committee_id, role, permissions, joined_at, is_active) FROM stdin;
\.


--
-- Data for Name: committees; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.committees (id, name, description, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.contacts (id, name, organization, role, phone, email, address, notes, category, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.conversation_participants (conversation_id, user_id, joined_at, last_read_at) FROM stdin;
\.


--
-- Data for Name: conversation_participants_old; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.conversation_participants_old (conversation_id, user_id, joined_at, last_read_at) FROM stdin;
\.


--
-- Data for Name: conversation_threads; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.conversation_threads (id, type, reference_id, title, created_by, is_active, created_at, updated_at, last_message_at) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.conversations (id, type, name, created_at) FROM stdin;
\.


--
-- Data for Name: conversations_old; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.conversations_old (id, type, name, created_at) FROM stdin;
\.


--
-- Data for Name: drive_links; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.drive_links (id, title, description, url, icon, icon_color) FROM stdin;
\.


--
-- Data for Name: driver_agreements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.driver_agreements (id, submitted_by, email, phone, license_number, vehicle_info, emergency_contact, emergency_phone, agreement_accepted, submitted_at) FROM stdin;
\.


--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.drivers (id, name, phone, email, address, notes, is_active, vehicle_type, license_number, availability, zone, route_description, host_location, host_id, van_approved, home_address, availability_notes, email_agreement_sent, voicemail_left, inactive_reason) FROM stdin;
\.


--
-- Data for Name: google_sheets; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.google_sheets (id, name, description, sheet_id, is_public, embed_url, direct_url, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: group_memberships; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.group_memberships (id, group_id, user_id, role, is_active, joined_at) FROM stdin;
\.


--
-- Data for Name: group_message_participants; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.group_message_participants (id, thread_id, user_id, status, joined_at, last_read_at, left_at, muted_at, archived_at) FROM stdin;
\.


--
-- Data for Name: host_contacts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.host_contacts (id, host_id, name, role, phone, email, is_primary, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hosted_files; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.hosted_files (id, title, description, file_name, original_name, file_path, file_size, mime_type, category, uploaded_by, is_public, download_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hosts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.hosts (id, name, address, status, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: meeting_minutes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.meeting_minutes (id, title, date, summary, color, file_name, file_path, file_type, mime_type, committee_type) FROM stdin;
\.


--
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.meetings (id, title, type, date, "time", location, description, final_agenda, status, created_at) FROM stdin;
\.


--
-- Data for Name: message_groups; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.message_groups (id, name, description, created_by, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages (id, conversation_id, user_id, content, sender, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messages_old; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.messages_old (id, conversation_id, user_id, content, sender, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, user_id, type, title, message, is_read, related_type, related_id, celebration_data, created_at) FROM stdin;
\.


--
-- Data for Name: project_assignments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_assignments (id, project_id, user_id, role, assigned_at) FROM stdin;
\.


--
-- Data for Name: project_comments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_comments (id, project_id, author_name, content, comment_type, created_at) FROM stdin;
\.


--
-- Data for Name: project_documents; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_documents (id, project_id, file_name, original_name, file_size, mime_type, uploaded_by, uploaded_at) FROM stdin;
\.


--
-- Data for Name: project_tasks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_tasks (id, project_id, title, description, status, priority, assignee_id, assignee_name, assignee_ids, assignee_names, due_date, completed_at, attachments, "order", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.projects (id, title, description, status, priority, category, assignee_id, assignee_name, assignee_ids, assignee_names, due_date, start_date, completion_date, progress_percentage, notes, requirements, deliverables, resources, blockers, tags, estimated_hours, actual_hours, budget, color, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: recipients; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.recipients (id, name, contact_name, phone, email, address, preferences, weekly_estimate, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sandwich_collections; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sandwich_collections (id, collection_date, host_name, individual_sandwiches, group_collections, submitted_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sessions (sid, sess, expire) FROM stdin;
WTzBe09oorG0qY7ON6DTsuZLkp3FDYK5	{"user": {"id": "admin_1751908044864", "role": "admin", "email": "admin@sandwich.project", "isActive": true, "lastName": "User", "firstName": "Admin", "permissions": [], "profileImageUrl": null}, "cookie": {"path": "/", "secure": false, "expires": "2025-07-14T17:20:09.551Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-07-14 17:20:10
XB440Y1km7AXBlW8lspUxvbpecq0pdr_	{"user": {"id": "admin_1751908044864", "role": "admin", "email": "admin@sandwich.project", "isActive": true, "lastName": "User", "firstName": "Admin", "permissions": [], "profileImageUrl": null}, "cookie": {"path": "/", "secure": false, "expires": "2025-07-14T17:22:08.027Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-07-14 17:22:11
2Yi-JosklVJTJ0rp9lfD1KhK2My8aajq	{"user": {"id": "admin_1751908044864", "role": "admin", "email": "admin@sandwich.project", "isActive": true, "lastName": "User", "firstName": "Admin", "permissions": [], "profileImageUrl": null}, "cookie": {"path": "/", "secure": false, "expires": "2025-07-14T17:20:21.778Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}}	2025-07-14 17:23:33
uIq--vvrzj0vk7QRsob5FqSnAbSzZ2w8	{"user": {"id": "admin_1751908044864", "role": "admin", "email": "admin@sandwich.project", "isActive": true, "lastName": "User", "firstName": "Admin", "permissions": ["MANAGE_USERS", "MANAGE_HOSTS", "MANAGE_RECIPIENTS", "MANAGE_DRIVERS", "MANAGE_COLLECTIONS", "MANAGE_ANNOUNCEMENTS", "MANAGE_COMMITTEES", "VIEW_PHONE_DIRECTORY", "VIEW_HOSTS", "VIEW_RECIPIENTS", "VIEW_DRIVERS", "VIEW_COMMITTEE", "VIEW_USERS", "GENERAL_CHAT", "COMMITTEE_CHAT", "HOST_CHAT", "DRIVER_CHAT", "CORE_TEAM_CHA