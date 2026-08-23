-- ============================================================
-- TripDito MVP DB Schema (PostgreSQL / Neon)
-- 출처: 트립디토_MVP_DB_테이블정의서 (2026-08-19, 18개 테이블)
-- 공통 컬럼: USE_AT CHAR(1) 'Y', RGST_DTTM, ALTR_DTTM(트리거 자동 갱신)
-- 재실행 가능(IF NOT EXISTS / ON CONFLICT DO NOTHING)
-- ============================================================

CREATE OR REPLACE FUNCTION set_altr_dttm() RETURNS trigger AS $$
BEGIN
  NEW.altr_dttm := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------- 04. 공통코드 (다른 테이블이 참조하므로 먼저) ----------
CREATE TABLE IF NOT EXISTS cmmn_grp_cd (
  cmmn_grp_cd_id  VARCHAR(20)  PRIMARY KEY,
  cmmn_grp_cd_nm  VARCHAR(255) NOT NULL,
  cmmn_grp_cd_dc  VARCHAR(255),
  use_at          CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  altr_dttm       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cmmn_grp_cd_detl (
  cmmn_grp_cd_id  VARCHAR(20)  NOT NULL REFERENCES cmmn_grp_cd(cmmn_grp_cd_id),
  detl_cd         VARCHAR(20)  NOT NULL,
  detl_cd_nm      VARCHAR(255) NOT NULL,
  sort_ordr       SMALLINT     NOT NULL DEFAULT 0,
  use_at          CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  altr_dttm       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (cmmn_grp_cd_id, detl_cd)
);

-- ---------- 04. 첨부파일 ----------
CREATE TABLE IF NOT EXISTS atcm_file_info (
  atcm_file_id  VARCHAR(30)  PRIMARY KEY,          -- ULID
  file_cnt      SMALLINT     NOT NULL DEFAULT 0,
  rgstr_sn      BIGINT,                             -- FK → user_info (아래에서 추가)
  use_at        CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  altr_dttm     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS atcm_file_detl_info (
  atcm_file_id  VARCHAR(30)  NOT NULL REFERENCES atcm_file_info(atcm_file_id) ON DELETE CASCADE,
  atcm_file_seq SMALLINT     NOT NULL,
  file_nm       VARCHAR(255) NOT NULL,
  file_ortx_nm  VARCHAR(255) NOT NULL,
  file_xtns_nm  VARCHAR(20)  NOT NULL,
  file_mg       BIGINT       NOT NULL,
  file_path     VARCHAR(500) NOT NULL,             -- R2 오브젝트 키
  use_at        CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  altr_dttm     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (atcm_file_id, atcm_file_seq)
);

-- ---------- 01. 회원 ----------
CREATE TABLE IF NOT EXISTS user_info (
  user_sn            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_uuid          UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  email              VARCHAR(255) UNIQUE,
  ncknm              VARCHAR(20)  UNIQUE,
  prfl_atcm_file_id  VARCHAR(30)  REFERENCES atcm_file_info(atcm_file_id),
  user_sttus_cd      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  last_lgn_dttm      TIMESTAMPTZ,
  wthdrw_dttm        TIMESTAMPTZ,
  use_at             CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  altr_dttm          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE atcm_file_info
    ADD CONSTRAINT fk_atcm_file_rgstr FOREIGN KEY (rgstr_sn) REFERENCES user_info(user_sn);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS oauth_acnt_info (
  oauth_acnt_sn    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_sn          BIGINT       NOT NULL REFERENCES user_info(user_sn) ON DELETE CASCADE,
  prvdr_cd         VARCHAR(20)  NOT NULL,           -- GOOGLE·KAKAO·NAVER
  prvdr_acnt_id    VARCHAR(255) NOT NULL,
  link_ty_cd       VARCHAR(20)  NOT NULL,           -- SIGNUP·EMAIL_MATCH
  acs_token        TEXT,
  rfrsh_token      TEXT,
  token_expr_dttm  TIMESTAMPTZ,
  use_at           CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  altr_dttm        TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (prvdr_cd, prvdr_acnt_id)
);
CREATE INDEX IF NOT EXISTS ix_oauth_acnt_user ON oauth_acnt_info(user_sn);

-- ---------- 02. 여행·쇼핑 ----------
CREATE TABLE IF NOT EXISTS trip_info (
  trip_sn        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_sn        BIGINT        NOT NULL REFERENCES user_info(user_sn),
  trip_nm        VARCHAR(100)  NOT NULL,
  ntn_cd         VARCHAR(10)   NOT NULL,
  cty_nm         VARCHAR(100)  NOT NULL,
  tz_id          VARCHAR(50)   NOT NULL DEFAULT 'Asia/Seoul',
  begin_de       DATE          NOT NULL,
  end_de         DATE          NOT NULL,
  crncy_cd       CHAR(3)       NOT NULL,
  bdgt_amt       NUMERIC(15,2) NOT NULL DEFAULT 0,
  trip_sttus_cd  VARCHAR(20)   NOT NULL DEFAULT 'PREP',
  use_at         CHAR(1)       NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  altr_dttm      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT ck_trip_period CHECK (end_de >= begin_de)
);
CREATE INDEX IF NOT EXISTS ix_trip_user ON trip_info(user_sn, use_at);

CREATE TABLE IF NOT EXISTS shop_item_info (
  shop_item_sn   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  trip_sn        BIGINT        NOT NULL REFERENCES trip_info(trip_sn) ON DELETE CASCADE,
  item_nm        VARCHAR(200)  NOT NULL,
  estm_amt       NUMERIC(15,2) NOT NULL DEFAULT 0,
  qy             INTEGER       NOT NULL DEFAULT 1 CHECK (qy >= 1),
  memo_cn        VARCHAR(500),
  atcm_file_id   VARCHAR(30)   REFERENCES atcm_file_info(atcm_file_id),
  prchs_plan_de  DATE,
  prchs_dttm     TIMESTAMPTZ,                       -- NULL = 미구매
  use_at         CHAR(1)       NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  altr_dttm      TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_shop_item_trip ON shop_item_info(trip_sn, use_at);

CREATE TABLE IF NOT EXISTS shop_item_tag_mpng (
  shop_item_sn  BIGINT      NOT NULL REFERENCES shop_item_info(shop_item_sn) ON DELETE CASCADE,
  gift_tag_cd   VARCHAR(20) NOT NULL,
  rgst_dttm     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shop_item_sn, gift_tag_cd)
);

-- ---------- 03. 때샷 ----------
CREATE TABLE IF NOT EXISTS shot_info (
  shot_sn        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_sn        BIGINT        NOT NULL REFERENCES user_info(user_sn),
  trip_sn        BIGINT        NOT NULL REFERENCES trip_info(trip_sn),
  chnl_cd        VARCHAR(20)   NOT NULL,            -- SHOTS·COMMUNITY
  atcm_file_id   VARCHAR(30)   NOT NULL REFERENCES atcm_file_info(atcm_file_id),
  body_cn        VARCHAR(2000),
  like_cnt       INTEGER       NOT NULL DEFAULT 0,
  cmnt_cnt       INTEGER       NOT NULL DEFAULT 0,
  shot_sttus_cd  VARCHAR(20)   NOT NULL DEFAULT 'PUBLIC',
  use_at         CHAR(1)       NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  altr_dttm      TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_shot_chnl ON shot_info(chnl_cd, shot_sttus_cd, rgst_dttm DESC);
CREATE INDEX IF NOT EXISTS ix_shot_user ON shot_info(user_sn);

CREATE TABLE IF NOT EXISTS shot_pin_info (
  shot_pin_sn    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shot_sn        BIGINT        NOT NULL REFERENCES shot_info(shot_sn) ON DELETE CASCADE,
  atcm_file_seq  SMALLINT      NOT NULL,
  x_pstn_rt      NUMERIC(5,2)  NOT NULL CHECK (x_pstn_rt BETWEEN 0 AND 100),
  y_pstn_rt      NUMERIC(5,2)  NOT NULL CHECK (y_pstn_rt BETWEEN 0 AND 100),
  pin_cn         VARCHAR(200)  NOT NULL,
  use_at         CHAR(1)       NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  altr_dttm      TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_shot_pin_shot ON shot_pin_info(shot_sn);

CREATE TABLE IF NOT EXISTS shot_item_mpng (
  shot_sn       BIGINT      NOT NULL REFERENCES shot_info(shot_sn) ON DELETE CASCADE,
  shop_item_sn  BIGINT      NOT NULL REFERENCES shop_item_info(shop_item_sn) ON DELETE CASCADE,
  rgst_dttm     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shot_sn, shop_item_sn)
);

CREATE TABLE IF NOT EXISTS shot_like_info (
  shot_sn    BIGINT      NOT NULL REFERENCES shot_info(shot_sn) ON DELETE CASCADE,
  user_sn    BIGINT      NOT NULL REFERENCES user_info(user_sn) ON DELETE CASCADE,
  rgst_dttm  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (shot_sn, user_sn)
);

CREATE TABLE IF NOT EXISTS shot_cmnt_info (
  shot_cmnt_sn   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  shot_sn        BIGINT       NOT NULL REFERENCES shot_info(shot_sn) ON DELETE CASCADE,
  user_sn        BIGINT       NOT NULL REFERENCES user_info(user_sn),
  upper_cmnt_sn  BIGINT       REFERENCES shot_cmnt_info(shot_cmnt_sn),
  cmnt_cn        VARCHAR(500) NOT NULL,
  del_dttm       TIMESTAMPTZ,
  use_at         CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  altr_dttm      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_shot_cmnt_shot ON shot_cmnt_info(shot_sn, rgst_dttm);

CREATE TABLE IF NOT EXISTS shot_scrp_info (
  user_sn    BIGINT      NOT NULL REFERENCES user_info(user_sn) ON DELETE CASCADE,
  shot_sn    BIGINT      NOT NULL REFERENCES shot_info(shot_sn) ON DELETE CASCADE,
  rgst_dttm  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_sn, shot_sn)
);

-- ---------- 04. 쿠폰 ----------
CREATE TABLE IF NOT EXISTS cpn_info (
  cpn_sn        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cpn_sj        VARCHAR(255) NOT NULL,
  mrhst_nm      VARCHAR(100) NOT NULL,
  bnef_cn       VARCHAR(50)  NOT NULL,
  link_url      VARCHAR(500) NOT NULL,
  ntn_cd        VARCHAR(10)  NOT NULL,
  aply_base_cd  VARCHAR(20)  NOT NULL DEFAULT 'ARVL', -- DPRTR·ARVL
  vld_begin_de  DATE,
  vld_end_de    DATE,
  src_cd        VARCHAR(20)  NOT NULL DEFAULT 'LIVE',  -- LIVE·FALLBACK
  use_at        CHAR(1)      NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm     TIMESTAMPTZ  NOT NULL DEFAULT now(),
  altr_dttm     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_cpn_ntn ON cpn_info(ntn_cd, use_at);
-- 외부 사이트 배치 적재 시 중복 방지 (link_url 기준)
CREATE UNIQUE INDEX IF NOT EXISTS ux_cpn_link ON cpn_info(link_url);

CREATE TABLE IF NOT EXISTS cpn_regn_info (
  cpn_sn     BIGINT      NOT NULL REFERENCES cpn_info(cpn_sn) ON DELETE CASCADE,
  regn_nm    VARCHAR(50) NOT NULL,                  -- 도쿄·오사카 또는 전국
  rgst_dttm  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (cpn_sn, regn_nm)
);

CREATE TABLE IF NOT EXISTS user_cpn_info (
  user_cpn_sn  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_sn      BIGINT      NOT NULL REFERENCES user_info(user_sn) ON DELETE CASCADE,
  cpn_sn       BIGINT      NOT NULL REFERENCES cpn_info(cpn_sn),
  issu_dttm    TIMESTAMPTZ NOT NULL DEFAULT now(),
  use_dttm     TIMESTAMPTZ,
  cpn_no       VARCHAR(50),
  use_at       CHAR(1)     NOT NULL DEFAULT 'Y' CHECK (use_at IN ('Y','N')),
  rgst_dttm    TIMESTAMPTZ NOT NULL DEFAULT now(),
  altr_dttm    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_sn, cpn_sn)
);

-- ---------- 기존 DB 보정: 공통 컬럼 누락분 추가 (정의서 p.8, 전 테이블 공통) ----------
ALTER TABLE shot_pin_info  ADD COLUMN IF NOT EXISTS use_at    CHAR(1)     NOT NULL DEFAULT 'Y';
ALTER TABLE shot_pin_info  ADD COLUMN IF NOT EXISTS altr_dttm TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE shot_cmnt_info ADD COLUMN IF NOT EXISTS use_at    CHAR(1)     NOT NULL DEFAULT 'Y';
ALTER TABLE user_cpn_info  ADD COLUMN IF NOT EXISTS use_at    CHAR(1)     NOT NULL DEFAULT 'Y';

-- ---------- ALTR_DTTM 자동 갱신 트리거 ----------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'cmmn_grp_cd','cmmn_grp_cd_detl','atcm_file_info','atcm_file_detl_info',
    'user_info','oauth_acnt_info','trip_info','shop_item_info',
    'shot_info','shot_pin_info','shot_cmnt_info','cpn_info','user_cpn_info'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_altr ON %1$s', t);
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_altr BEFORE UPDATE ON %1$s FOR EACH ROW EXECUTE FUNCTION set_altr_dttm()', t);
  END LOOP;
END $$;
