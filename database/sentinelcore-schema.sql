--
-- PostgreSQL database dump
--

\restrict 2qVINabPNoytkOj6oOe7GDW9MhPpdhoM46GjkMHFDNr04NeeTtwNvClupjrdGH3

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alerts (
    id bigint NOT NULL,
    asset_id bigint,
    alert_type character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    message text NOT NULL,
    status character varying(30) NOT NULL,
    created_at timestamp without time zone NOT NULL,
    acknowledged_at timestamp without time zone
);


--
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alerts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts.id;


--
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    ip_address character varying(45),
    location character varying(150),
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL
);


--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: cloud_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cloud_resources (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    resource_type character varying(50) NOT NULL,
    provider character varying(50) NOT NULL,
    region character varying(100),
    status character varying(50) NOT NULL,
    created_at timestamp without time zone NOT NULL
);


--
-- Name: cloud_resources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cloud_resources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cloud_resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cloud_resources_id_seq OWNED BY public.cloud_resources.id;


--
-- Name: infrastructure_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.infrastructure_metrics (
    id bigint NOT NULL,
    asset_id bigint NOT NULL,
    cpu_usage numeric(5,2),
    memory_usage numeric(5,2),
    disk_usage numeric(5,2),
    network_in numeric(12,2),
    network_out numeric(12,2),
    "timestamp" timestamp without time zone NOT NULL
);


--
-- Name: infrastructure_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.infrastructure_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: infrastructure_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.infrastructure_metrics_id_seq OWNED BY public.infrastructure_metrics.id;


--
-- Name: network_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.network_metrics (
    id bigint NOT NULL,
    network_name character varying(100) NOT NULL,
    status character varying(50) NOT NULL,
    network_in numeric(12,2),
    network_out numeric(12,2),
    latency numeric(10,2),
    packet_loss numeric(5,2),
    "timestamp" timestamp without time zone NOT NULL
);


--
-- Name: network_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.network_metrics_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: network_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.network_metrics_id_seq OWNED BY public.network_metrics.id;


--
-- Name: alerts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: cloud_resources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cloud_resources ALTER COLUMN id SET DEFAULT nextval('public.cloud_resources_id_seq'::regclass);


--
-- Name: infrastructure_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.infrastructure_metrics ALTER COLUMN id SET DEFAULT nextval('public.infrastructure_metrics_id_seq'::regclass);


--
-- Name: network_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.network_metrics ALTER COLUMN id SET DEFAULT nextval('public.network_metrics_id_seq'::regclass);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: cloud_resources cloud_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cloud_resources
    ADD CONSTRAINT cloud_resources_pkey PRIMARY KEY (id);


--
-- Name: infrastructure_metrics infrastructure_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.infrastructure_metrics
    ADD CONSTRAINT infrastructure_metrics_pkey PRIMARY KEY (id);


--
-- Name: network_metrics network_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.network_metrics
    ADD CONSTRAINT network_metrics_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: infrastructure_metrics infrastructure_metrics_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.infrastructure_metrics
    ADD CONSTRAINT infrastructure_metrics_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 2qVINabPNoytkOj6oOe7GDW9MhPpdhoM46GjkMHFDNr04NeeTtwNvClupjrdGH3

