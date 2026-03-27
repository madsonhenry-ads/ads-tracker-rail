--
-- PostgreSQL database dump
--

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: ad_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ad_snapshots (
    id text NOT NULL,
    "pageId" text NOT NULL,
    "totalAds" integer NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "collectionPeriod" text DEFAULT '8d'::text NOT NULL,
    "scrapeDuration" integer,
    success boolean DEFAULT true NOT NULL,
    "errorMessage" text,
    "rawData" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.ad_snapshots OWNER TO postgres;

--
-- Name: metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metrics (
    id text NOT NULL,
    "pageId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "totalAds" integer NOT NULL,
    "dailyChange" integer,
    "weeklyChange" integer,
    "monthlyChange" integer,
    "dailyChangePercent" double precision,
    "weeklyChangePercent" double precision,
    "monthlyChangePercent" double precision,
    "movingAvg7d" double precision,
    "movingAvg30d" double precision,
    "maxAdsLast7d" integer,
    "minAdsLast7d" integer,
    "avgAdsLast7d" double precision,
    trend text,
    "anomalyDetected" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.metrics OWNER TO postgres;

--
-- Name: pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pages (
    id text NOT NULL,
    name text NOT NULL,
    "facebookPageId" text NOT NULL,
    url text NOT NULL,
    description text,
    country text,
    language text,
    category text,
    tags text[],
    active boolean DEFAULT true NOT NULL,
    "lastScrapedAt" timestamp(3) without time zone,
    "scrapingEnabled" boolean DEFAULT true NOT NULL,
    "scrapePeriod" text DEFAULT '8d'::text NOT NULL,
    "scrapeFrequency" text DEFAULT 'daily'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "checkoutUrl" text,
    "offerUrl" text
);


ALTER TABLE public.pages OWNER TO postgres;

--
-- Name: scraping_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scraping_logs (
    id text NOT NULL,
    "pageId" text,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    duration integer,
    status text NOT NULL,
    "pagesScraped" integer DEFAULT 0 NOT NULL,
    "pagesSuccess" integer DEFAULT 0 NOT NULL,
    "pagesFailed" integer DEFAULT 0 NOT NULL,
    errors jsonb[],
    "triggeredBy" text
);


ALTER TABLE public.scraping_logs OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
b7b5f13a-3957-4544-aa1a-1325437f5f18	bf8857825d17555b061b9afcbfe1aa3a4db0a85d2c52c024d9917b954bded2d7	2026-02-08 21:09:08.456123+00	20260117211949_init	\N	\N	2026-02-08 21:09:08.219942+00	1
f233962b-c020-4488-9fa3-1c36ac1c5f28	3890c617e0a26a745bac132b4b874df69e0117377d1e548fc4a9850af9463c11	2026-02-08 21:09:16.356115+00	20260208210916_add_offer_checkout_urls	\N	\N	2026-02-08 21:09:16.342149+00	1
\.


--
-- Data for Name: ad_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ad_snapshots (id, "pageId", "totalAds", "timestamp", date, "collectionPeriod", "scrapeDuration", success, "errorMessage", "rawData", "createdAt") FROM stdin;
44a5690c-152c-4287-8b92-b40351ad5382	7273941f-0946-4548-bbba-6c004e2065ed	140	2026-03-26 00:00:00	2026-03-26 00:00:00	8d	\N	t	\N	\N	2026-03-26 23:32:38.991
9f796495-c38d-4114-89d5-4d963cae21d9	408c44d4-d375-457a-b9e3-0748002897ed	228	2026-03-26 00:00:00	2026-03-26 00:00:00	30d	\N	t	\N	\N	2026-03-26 23:32:39.011
3984c2fd-963b-4842-978b-ad96f09e04d2	7273941f-0946-4548-bbba-6c004e2065ed	107	2026-03-25 00:00:00	2026-03-25 00:00:00	8d	\N	t	\N	\N	2026-03-26 23:32:39.052
2d610299-7ba5-4419-9eac-47d737100823	408c44d4-d375-457a-b9e3-0748002897ed	225	2026-03-25 00:00:00	2026-03-25 00:00:00	30d	\N	t	\N	\N	2026-03-26 23:32:39.062
df19d79e-7013-4be2-86be-8cbfbbb67865	7273941f-0946-4548-bbba-6c004e2065ed	133	2026-03-24 00:00:00	2026-03-24 00:00:00	8d	\N	t	\N	\N	2026-03-26 23:32:39.092
f4d1a44f-47b0-435e-88dd-ec4afb60f15b	408c44d4-d375-457a-b9e3-0748002897ed	253	2026-03-24 00:00:00	2026-03-24 00:00:00	30d	\N	t	\N	\N	2026-03-26 23:32:39.102
0e66e959-40c4-40fa-b645-935ced5a4cc4	7273941f-0946-4548-bbba-6c004e2065ed	102	2026-03-23 00:00:00	2026-03-23 00:00:00	8d	\N	t	\N	\N	2026-03-26 23:32:39.13
a1d9a267-74a6-4121-becf-0aab5bfa9bb7	408c44d4-d375-457a-b9e3-0748002897ed	235	2026-03-23 00:00:00	2026-03-23 00:00:00	30d	\N	t	\N	\N	2026-03-26 23:32:39.138
78323ffc-c22c-4408-8f3d-e47b353327a1	7273941f-0946-4548-bbba-6c004e2065ed	123	2026-03-22 00:00:00	2026-03-22 00:00:00	8d	\N	t	\N	\N	2026-03-26 23:32:39.164
43fabe85-4ba3-499b-b27e-96814971618a	408c44d4-d375-457a-b9e3-0748002897ed	200	2026-03-22 00:00:00	2026-03-22 00:00:00	30d	\N	t	\N	\N	2026-03-26 23:32:39.172
\.


--
-- Data for Name: metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metrics (id, "pageId", date, "totalAds", "dailyChange", "weeklyChange", "monthlyChange", "dailyChangePercent", "weeklyChangePercent", "monthlyChangePercent", "movingAvg7d", "movingAvg30d", "maxAdsLast7d", "minAdsLast7d", "avgAdsLast7d", trend, "anomalyDetected", "createdAt", "updatedAt") FROM stdin;
92bce9bd-37ba-456c-be9c-1b6873283941	7273941f-0946-4548-bbba-6c004e2065ed	2026-03-26 00:00:00	120	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-26 23:32:39.022	2026-03-26 23:32:39.022
addc6aad-7cf5-44aa-b0c4-698de92d36a0	408c44d4-d375-457a-b9e3-0748002897ed	2026-03-26 00:00:00	257	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-26 23:32:39.039	2026-03-26 23:32:39.039
0fb15763-e95b-45a3-8adb-fa1852c03259	7273941f-0946-4548-bbba-6c004e2065ed	2026-03-25 00:00:00	134	-3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-26 23:32:39.071	2026-03-26 23:32:39.071
0789161d-deeb-4481-866e-51cbaaf07bea	408c44d4-d375-457a-b9e3-0748002897ed	2026-03-25 00:00:00	224	-4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-26 23:32:39.08	2026-03-26 23:32:39.08
b94fa653-30e7-4517-8d24-e0c85afa87de	7273941f-0946-4548-bbba-6c004e2065ed	2026-03-24 00:00:00	118	-4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-26 23:32:39.112	2026-03-26 23:32:39.112
86887d74-d670-4bab-849f-6743e4af6948	408c44d4-d375-457a-b9e3-0748002897ed	2026-03-24 00:00:00	211	6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-26 23:32:39.121	2026-03-26 23:32:39.121
2579c081-3d76-4ec4-90db-9dc09ab6c22e	7273941f-0946-4548-bbba-6c004e2065ed	2026-03-23 00:00:00	128	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-26 23:32:39.146	2026-03-26 23:32:39.146
2668d997-3db1-4c3d-b634-367a891a3b3a	408c44d4-d375-457a-b9e3-0748002897ed	2026-03-23 00:00:00	262	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-26 23:32:39.156	2026-03-26 23:32:39.156
99a846c9-3d7f-4f44-9080-e421ac506a8e	7273941f-0946-4548-bbba-6c004e2065ed	2026-03-22 00:00:00	126	3	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-26 23:32:39.181	2026-03-26 23:32:39.181
0dc5ccf5-e003-4d1d-86c0-959eafe71409	408c44d4-d375-457a-b9e3-0748002897ed	2026-03-22 00:00:00	260	7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-03-26 23:32:39.19	2026-03-26 23:32:39.19
\.


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pages (id, name, "facebookPageId", url, description, country, language, category, tags, active, "lastScrapedAt", "scrapingEnabled", "scrapePeriod", "scrapeFrequency", "createdAt", "updatedAt", "checkoutUrl", "offerUrl") FROM stdin;
7273941f-0946-4548-bbba-6c004e2065ed	Exemplo de Página 1	1234567890123456	https://www.facebook.com/ads/library/?id=1234567890123456	Uma página de exemplo para testes	BR	pt	E-commerce	{teste,exemplo}	t	\N	t	8d	daily	2026-03-26 23:32:38.942	2026-03-26 23:32:38.942	\N	\N
408c44d4-d375-457a-b9e3-0748002897ed	Exemplo de Página 2	9876543210987654	https://www.facebook.com/ads/library/?id=9876543210987654	Outra página para demonstração	US	en	Marketing	{demo,marketing}	t	\N	t	30d	weekly	2026-03-26 23:32:38.978	2026-03-26 23:32:38.978	\N	\N
\.


--
-- Data for Name: scraping_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scraping_logs (id, "pageId", "startedAt", "completedAt", duration, status, "pagesScraped", "pagesSuccess", "pagesFailed", errors, "triggeredBy") FROM stdin;
58103148-657b-4a85-89a0-34a0bdd4a411	\N	2026-02-08 22:11:27.359	2026-02-08 22:12:35.766	68407	completed	9	9	0	\N	api
6c369410-1ba7-49e1-ac00-0c5e1ad39129	\N	2026-02-09 23:07:24.967	2026-02-09 23:09:10.63	105663	completed	9	9	0	\N	api
e9b78195-2061-49ad-a3f2-4245af258c9a	\N	2026-02-10 20:04:57.616	2026-02-10 20:06:17.352	79736	completed	9	9	0	\N	api
171b08d5-cb21-4a7f-9d39-b47949a585df	\N	2026-02-10 22:12:41.417	2026-02-10 22:15:17.611	156194	completed	18	18	0	\N	api
1cfe41cf-933a-4b65-bd73-38fb0e60b27a	\N	2026-02-10 22:17:18.605	2026-02-10 22:19:42.96	144355	completed	18	18	0	\N	api
7c728ac8-1d63-471c-8a19-af2f72ebf638	\N	2026-02-11 11:02:31.373	2026-02-11 11:05:26.319	174946	completed	18	18	0	\N	api
54f1a085-f9f0-4af2-9b73-b20c5d60991e	\N	2026-02-11 11:04:24.833	2026-02-11 11:07:21.496	176663	completed	18	18	0	\N	api
20b29285-97ae-478c-94f9-f0f7a33fd0ef	\N	2026-02-11 11:05:20.94	2026-02-11 11:08:20.321	179381	completed	18	18	0	\N	api
04778b85-d640-4335-9000-db45674fa7ac	\N	2026-02-11 21:08:19.109	2026-02-11 21:12:07.76	228651	completed	26	26	0	\N	api
3b5ca8e0-d3e6-44ac-a0b5-caf8d1ee4dc0	\N	2026-02-12 10:06:09.769	2026-02-12 10:10:01.447	231678	completed	26	26	0	\N	api
217f7182-5d6f-4045-9904-e94818feaa5e	\N	2026-02-13 10:09:45.251	2026-02-13 10:17:35.301	470050	completed	26	25	1	\N	api
a3836cea-4f30-457a-9605-2926979459e2	\N	2026-02-13 10:13:56.057	2026-02-13 10:19:45.162	349105	completed	26	26	0	\N	api
764493f5-e529-417a-9783-cfca4c384b90	\N	2026-02-13 12:54:24.165	2026-02-13 13:00:00.197	336032	completed	34	34	0	\N	api
7905be54-8fbf-404b-b1c0-fa816876f832	\N	2026-02-13 15:00:31.426	2026-02-13 15:07:24.458	413032	completed	44	44	0	\N	api
8a572993-77fa-42b2-a2db-6f36f162c98c	\N	2026-02-14 18:26:58.777	2026-02-14 18:33:58.933	420156	completed	44	44	0	\N	api
42fde667-4278-4d93-941c-f8ede3b27174	\N	2026-02-15 10:38:15.911	2026-02-15 10:44:29.675	373764	completed	44	44	0	\N	api
70537591-a283-44c1-afbc-1740a22b981f	\N	2026-02-16 09:54:05.667	2026-02-16 10:00:49.23	403563	completed	44	44	0	\N	api
5177ab4f-c161-4a6c-ad2f-dfaeb115b661	\N	2026-02-18 10:55:09.496	2026-02-18 11:01:54.864	405368	completed	44	44	0	\N	api
fa5c711d-c9f0-42a5-a334-907315cd11e6	\N	2026-02-20 12:20:02.999	2026-02-20 12:27:23.883	440884	completed	44	44	0	\N	api
06f65057-02b6-4a87-a0fd-bd68cfa7d5ee	\N	2026-02-22 20:44:48.856	2026-02-22 20:50:36.123	347267	completed	44	44	0	\N	api
3c9e6b01-671b-45ed-a4b7-8c0999372fce	\N	2026-02-23 09:31:49.68	2026-02-23 09:40:29.093	519413	completed	44	44	0	\N	api
000449d9-bef2-4af0-b1af-bb4f2ba28cca	\N	2026-02-24 11:06:00.311	2026-02-24 11:12:08.971	368660	completed	44	44	0	\N	api
c3607469-d6a0-4f50-b240-8543a3506b73	\N	2026-02-25 10:57:59.403	2026-02-25 11:04:04.225	364822	completed	44	44	0	\N	api
9dffdd13-6211-4752-b913-6a67606bc9d4	\N	2026-02-26 22:40:58.328	2026-02-26 22:48:39.805	461477	completed	44	44	0	\N	api
6c4b961d-3587-4f8f-b0c4-b19239c8c207	\N	2026-03-02 09:49:27.953	2026-03-02 09:55:47.638	379685	completed	44	44	0	\N	api
6d745584-0742-49cc-803f-d0dba7188558	\N	2026-03-07 11:35:55.098	2026-03-07 11:41:57.756	362658	completed	44	44	0	\N	api
68cef527-a983-4e20-8d1a-9ba1e90e454a	\N	2026-03-07 11:35:44.834	2026-03-07 11:41:58.788	373954	completed	44	44	0	\N	api
39c77045-38fa-4960-b968-a97b50d0369c	\N	2026-03-10 09:52:53.044	2026-03-10 09:58:47.391	354347	completed	44	44	0	\N	api
ed23ecab-3c79-46a8-a55c-adfed61e589c	\N	2026-03-11 22:47:07.981	2026-03-11 22:55:46.494	518513	completed	52	52	0	\N	api
7460c76c-6de3-4c78-ac3f-13d7deda59ed	\N	2026-03-12 14:29:22.436	2026-03-12 14:35:55.525	393089	completed	52	52	0	\N	api
fa42f41c-4c5a-4f65-9f52-401e8502ef4b	\N	2026-03-13 10:58:01.424	2026-03-13 11:03:36.308	334884	completed	38	38	0	\N	api
854576d7-d613-4365-9dfa-9710a7dfc25b	\N	2026-03-13 14:26:02.038	2026-03-13 14:33:33.16	451122	completed	50	50	0	\N	api
3ba8ef3e-6d25-46ef-b978-10a590fb6e33	\N	2026-03-14 10:08:47.767	2026-03-14 10:16:31.729	463962	completed	50	50	0	\N	api
f6804246-b314-43ba-a4f2-05e2a27e50c8	\N	2026-03-15 20:58:54.21	2026-03-15 21:07:05.884	491674	completed	56	56	0	\N	api
4b37bf10-a73a-4bba-84dd-cef70af01dda	\N	2026-03-16 09:30:17.84	2026-03-16 09:38:54.722	516882	completed	56	56	0	\N	api
f6c6fc5b-0a95-4049-aa66-77117eb78425	\N	2026-03-17 09:51:53.887	2026-03-17 10:00:30.863	516976	completed	56	56	0	\N	api
712b10d8-ffa9-4f94-b8ff-cb2673a1b7f5	\N	2026-03-17 21:56:06.005	2026-03-17 22:04:30.329	504324	completed	57	57	0	\N	api
9ba9dfc8-0495-4a89-8b63-36ede9d8b21f	\N	2026-03-18 21:47:28.953	2026-03-18 21:55:48.531	499578	completed	57	57	0	\N	api
337e2d25-bf6a-411d-bc00-095914b66b00	\N	2026-03-19 20:50:55.438	2026-03-19 20:59:23.032	507594	completed	57	57	0	\N	api
a43b54ad-1854-42d6-b363-f5e91ce26e9a	\N	2026-03-20 11:55:58.077	2026-03-20 12:07:11.639	673562	completed	60	60	0	\N	api
17e14ffd-801b-47e8-9c28-fb975566f4cd	\N	2026-03-22 09:03:02.599	2026-03-22 09:11:55.462	532863	completed	61	61	0	\N	api
6d7b358b-3fd2-4118-8cf5-89d9155ab757	\N	2026-03-23 17:13:56.784	2026-03-23 17:24:33.27	636486	completed	61	61	0	\N	api
82c161aa-349b-4361-8433-9c1cd3d370c5	\N	2026-03-24 20:45:33.213	2026-03-24 21:04:31.545	1138332	completed	61	61	0	\N	api
7f9f5f6b-be2b-4bb3-8953-9fe8ef25fb97	\N	2026-03-24 20:45:52.63	2026-03-24 21:04:57.599	1144969	completed	61	61	0	\N	api
13c5fb21-9efa-4d51-bfdc-172dbb692450	\N	2026-03-24 20:44:36.767	2026-03-24 21:05:53.491	1276724	completed	61	61	0	\N	api
ccff0a16-b080-4273-b28b-42335ab2b1dd	\N	2026-03-25 21:58:26.772	2026-03-25 22:07:35.455	548683	completed	62	62	0	\N	api
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: ad_snapshots ad_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_snapshots
    ADD CONSTRAINT ad_snapshots_pkey PRIMARY KEY (id);


--
-- Name: metrics metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metrics
    ADD CONSTRAINT metrics_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: scraping_logs scraping_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scraping_logs
    ADD CONSTRAINT scraping_logs_pkey PRIMARY KEY (id);


--
-- Name: ad_snapshots_pageId_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ad_snapshots_pageId_date_idx" ON public.ad_snapshots USING btree ("pageId", date);


--
-- Name: ad_snapshots_pageId_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ad_snapshots_pageId_date_key" ON public.ad_snapshots USING btree ("pageId", date);


--
-- Name: ad_snapshots_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ad_snapshots_timestamp_idx ON public.ad_snapshots USING btree ("timestamp");


--
-- Name: metrics_pageId_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "metrics_pageId_date_idx" ON public.metrics USING btree ("pageId", date);


--
-- Name: metrics_pageId_date_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "metrics_pageId_date_key" ON public.metrics USING btree ("pageId", date);


--
-- Name: pages_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pages_active_idx ON public.pages USING btree (active);


--
-- Name: pages_facebookPageId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "pages_facebookPageId_idx" ON public.pages USING btree ("facebookPageId");


--
-- Name: pages_facebookPageId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "pages_facebookPageId_key" ON public.pages USING btree ("facebookPageId");


--
-- Name: scraping_logs_startedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "scraping_logs_startedAt_idx" ON public.scraping_logs USING btree ("startedAt");


--
-- Name: scraping_logs_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX scraping_logs_status_idx ON public.scraping_logs USING btree (status);


--
-- Name: ad_snapshots ad_snapshots_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ad_snapshots
    ADD CONSTRAINT "ad_snapshots_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES public.pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: metrics metrics_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metrics
    ADD CONSTRAINT "metrics_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES public.pages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--