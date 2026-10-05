-- Initial content is part of the versioned migration; local resets and production receive the same forms.
do $$ declare t uuid; v uuid; q uuid; begin
insert into connect.form_templates(slug,kind,name) values('initial-onboarding','onboarding','Questionário inicial') returning id into t;
insert into connect.form_versions(form_template_id,version,title) values(t,1,jsonb_build_object('pt-BR','Questionário inicial')) returning id into v;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'operatesInFinancialMarket',jsonb_build_object('pt-BR','Você já opera no mercado financeiro?'),'single_choice',true,1,'{"max_length":2000}') returning id into q;
insert into connect.form_question_options(question_id,value,label,position) values(q,'yes',jsonb_build_object('pt-BR','Sim'),1);
insert into connect.form_question_options(question_id,value,label,position) values(q,'no',jsonb_build_object('pt-BR','Não'),2);
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'tradingKnowledgeTime',jsonb_build_object('pt-BR','Há quanto tempo conhece trading?'),'short_text',true,2,'{"max_length":2000}') returning id into q;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'tookCoursesBefore',jsonb_build_object('pt-BR','Já fez algum curso anteriormente?'),'single_choice',true,3,'{"max_length":2000}') returning id into q;
insert into connect.form_question_options(question_id,value,label,position) values(q,'yes',jsonb_build_object('pt-BR','Sim'),1);
insert into connect.form_question_options(question_id,value,label,position) values(q,'no',jsonb_build_object('pt-BR','Não'),2);
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'currentProfession',jsonb_build_object('pt-BR','Qual é sua profissão atual?'),'short_text',true,4,'{"max_length":2000}') returning id into q;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'availableTime',jsonb_build_object('pt-BR','Quantas horas por dia ou semana tem disponíveis?'),'short_text',true,5,'{"max_length":2000}') returning id into q;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'mainGoal',jsonb_build_object('pt-BR','Qual seu principal objetivo com o mercado?'),'long_text',true,6,'{"max_length":2000}') returning id into q;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'tradingIntention',jsonb_build_object('pt-BR','Pretende transformar trading em profissão ou renda complementar?'),'single_choice',true,7,'{"max_length":2000}') returning id into q;
insert into connect.form_question_options(question_id,value,label,position) values(q,'profession',jsonb_build_object('pt-BR','Profissão'),1);
insert into connect.form_question_options(question_id,value,label,position) values(q,'extra_income',jsonb_build_object('pt-BR','Renda complementar'),2);
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'biggestDifficulty',jsonb_build_object('pt-BR','Qual sua maior dificuldade hoje?'),'long_text',true,8,'{"max_length":2000}') returning id into q;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'expectations30Days',jsonb_build_object('pt-BR','O que espera aprender nesses 30 dias?'),'long_text',true,9,'{"max_length":2000}') returning id into q;
update connect.form_versions set status='published',published_at=now() where id=v;
insert into connect.form_assignments(form_version_id,is_required) values(v,true);
insert into connect.form_templates(slug,kind,name) values('post-meeting-reflection','post_meeting','Diário da reunião') returning id into t;
insert into connect.form_versions(form_template_id,version,title) values(t,1,jsonb_build_object('pt-BR','Diário da reunião')) returning id into v;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'learned_today',jsonb_build_object('pt-BR','O que você aprendeu hoje?'),'long_text',true,1,'{"max_length":2000}') returning id into q;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'would_enter',jsonb_build_object('pt-BR','Você teria entrado nessa operação? Por quê?'),'long_text',false,2,'{"max_length":2000}') returning id into q;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'would_change',jsonb_build_object('pt-BR','O que faria diferente?'),'long_text',false,3,'{"max_length":2000}') returning id into q;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'main_learning',jsonb_build_object('pt-BR','Qual foi o principal aprendizado?'),'long_text',false,4,'{"max_length":2000}') returning id into q;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'no_trade_reason',jsonb_build_object('pt-BR','Se não houve operação, por que foi correto não operar?'),'long_text',false,5,'{"max_length":2000}') returning id into q;
insert into connect.form_questions(form_version_id,question_key,label,question_type,is_required,position,validation) values(v,'notes',jsonb_build_object('pt-BR','Observações pessoais'),'long_text',false,6,'{"max_length":2000}') returning id into q;
update connect.form_versions set status='published',published_at=now() where id=v;
end $$;

