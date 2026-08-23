-- 공통코드 초기 데이터 (정의서 p.39-40). 재실행 안전.
INSERT INTO cmmn_grp_cd (cmmn_grp_cd_id, cmmn_grp_cd_nm, cmmn_grp_cd_dc) VALUES
  ('NTN',        '국가',           'TRIP_INFO.NTN_CD · CPN_INFO.NTN_CD'),
  ('CRNCY',      '통화',           'TRIP_INFO.CRNCY_CD (ISO 4217)'),
  ('TRIP_STTUS', '여행 상태',      'TRIP_INFO.TRIP_STTUS_CD'),
  ('GIFT_TAG',   '선물 태그',      'SHOP_ITEM_TAG_MPNG.GIFT_TAG_CD'),
  ('CHNL',       '때샷 채널',      'SHOT_INFO.CHNL_CD'),
  ('SHOT_STTUS', '게시 상태',      'SHOT_INFO.SHOT_STTUS_CD'),
  ('PRVDR',      '소셜 제공자',    'OAUTH_ACNT_INFO.PRVDR_CD'),
  ('LINK_TY',    '소셜 연결 유형', 'OAUTH_ACNT_INFO.LINK_TY_CD'),
  ('USER_STTUS', '회원 상태',      'USER_INFO.USER_STTUS_CD'),
  ('APLY_BASE',  '쿠폰 적용 기준', 'CPN_INFO.APLY_BASE_CD'),
  ('CPN_SRC',    '쿠폰 출처',      'CPN_INFO.SRC_CD')
ON CONFLICT (cmmn_grp_cd_id) DO NOTHING;

INSERT INTO cmmn_grp_cd_detl (cmmn_grp_cd_id, detl_cd, detl_cd_nm, sort_ordr) VALUES
  ('NTN','JP','일본',1), ('NTN','CN','중국',2), ('NTN','TW','대만',3), ('NTN','TH','태국',4), ('NTN','KR','한국',5),
  ('CRNCY','JPY','엔 (JPY)',1), ('CRNCY','CNY','위안 (CNY)',2), ('CRNCY','TWD','대만달러 (TWD)',3),
  ('CRNCY','THB','바트 (THB)',4), ('CRNCY','KRW','원 (KRW)',5), ('CRNCY','USD','달러 (USD)',6),
  ('TRIP_STTUS','PREP','준비전',1), ('TRIP_STTUS','PLANNED','예정',2), ('TRIP_STTUS','ONGOING','여행중',3), ('TRIP_STTUS','DONE','완료',4),
  ('GIFT_TAG','SELF','나',1), ('GIFT_TAG','FAMILY','가족',2), ('GIFT_TAG','FRIEND','친구',3), ('GIFT_TAG','COWORK','동료',4),
  -- 앱 화면의 '지인' 태그 (정의서 4개 외 확장 코드)
  ('GIFT_TAG','ACQNT','지인',5),
  ('CHNL','SHOTS','때샷',1), ('CHNL','COMMUNITY','커뮤니티',2),
  ('SHOT_STTUS','PUBLIC','공개',1), ('SHOT_STTUS','HIDDEN','숨김',2), ('SHOT_STTUS','DELETED','삭제',3),
  ('PRVDR','GOOGLE','구글',1), ('PRVDR','KAKAO','카카오',2), ('PRVDR','NAVER','네이버',3),
  -- 소셜 키 발급 전 임시 개발용 로그인 (ENABLE_DEV_LOGIN)
  ('PRVDR','DEV','개발용',9),
  ('LINK_TY','SIGNUP','신규 가입',1), ('LINK_TY','EMAIL_MATCH','이메일 일치 연결',2),
  ('USER_STTUS','ACTIVE','활성',1), ('USER_STTUS','DORMANT','휴면',2), ('USER_STTUS','WTHDRW','탈퇴',3),
  ('APLY_BASE','DPRTR','출발지',1), ('APLY_BASE','ARVL','도착지',2),
  ('CPN_SRC','LIVE','실시간',1), ('CPN_SRC','FALLBACK','폴백',2)
ON CONFLICT (cmmn_grp_cd_id, detl_cd) DO NOTHING;
