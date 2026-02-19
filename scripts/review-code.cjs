#!/usr/bin/env node
/**
 * Gemini Flash 코드 검수 스크립트
 * Education Builder Studio
 *
 * 사용법:
 *   node scripts/review-code.cjs              # git diff 변경사항 검수
 *   node scripts/review-code.cjs --file <파일경로>  # 특정 파일 검수
 *   node scripts/review-code.cjs --plan "<계획>"    # 계획/설계 검수
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 환경변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY가 .env.local에 없습니다');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// CLAUDE.md 규칙 로드
function loadProjectRules() {
  const claudeMdPath = path.join(__dirname, '..', 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    return fs.readFileSync(claudeMdPath, 'utf-8');
  }
  return '';
}

// git diff 가져오기 (컨텍스트 15줄로 확대)
function getGitDiff() {
  try {
    const diff = execSync('git diff HEAD -U15', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
    return diff || '변경사항 없음';
  } catch (e) {
    return '변경사항 없음';
  }
}

// 변경된 파일의 전체 내용 가져오기 (맥락 파악용)
function getChangedFilesContent() {
  try {
    const files = execSync('git diff HEAD --name-only', {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8'
    }).trim().split('\n').filter(f => f && !f.includes('.json') && !f.includes('.md') && !f.includes('.lock'));

    let context = '';
    for (const file of files.slice(0, 5)) { // 최대 5개 파일
      const fullPath = path.join(__dirname, '..', file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.length < 30000) { // 30KB 이하만
          context += `\n\n===== 전체 파일: ${file} =====\n${content}`;
        }
      }
    }
    return context;
  } catch (e) {
    return '';
  }
}

// 특정 파일 읽기
function readFile(filePath) {
  const fullPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
    process.exit(1);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

// Gemini Flash로 검수
async function reviewWithGemini(content, type = 'code') {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const projectRules = loadProjectRules();

  const systemPrompt = `당신은 시니어 코드 리뷰어입니다. 절대 맞장구치지 마세요.
당신의 역할은 버그를 찾는 것입니다. "통과"를 주는 게 아닙니다.
모든 변경에 버그가 있다고 가정하고, 없다는 것을 증명해야 합니다.

## 🔴 핵심 원칙: 의심하고 증명하라
- "문제 없어 보인다"는 검수가 아닙니다
- 변경된 코드가 **실제로 실행될 때** 어떤 일이 일어나는지 추적하세요
- diff만 보지 말고, **전체 파일 맥락**에서 이 코드가 어떻게 호출되는지 확인하세요
- "이 코드가 왜 이전 코드보다 나은가?"를 스스로 답할 수 없으면 🟡 주의로 표시하세요

## 프로젝트 핵심 정보 (Education Builder Studio)
- **기술 스택**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **인증**: Firebase Auth (이메일/비밀번호)
- **DB**: Cloud SQL PostgreSQL (pg 라이브러리)
- **파일 저장**: Google Cloud Storage
- **AI**: Gemini 2.0 Flash + text-embedding-004 (RAG)
- **배포**: Netlify
- **서버 컴포넌트 vs 클라이언트**: Next.js App Router 규칙 준수 필수
- **환경변수**: 서버 전용(FIREBASE_ADMIN_*, DATABASE_URL) vs 클라이언트(NEXT_PUBLIC_*)
- **PEM 키 손상 주의**: Netlify 환경변수에서 PEM 키 공백 손상 가능 (PRIVATE KEY → PRIVATEKEY)

## 검수 기준 (우선순위 순)

### 1. 🔴 실행 흐름 & 타이밍 검증 (가장 중요!)
- 이 코드가 **서버에서 실행되는가 클라이언트에서 실행되는가?**
- 서버 컴포넌트에서 'use client' 없이 useState/useEffect 사용하고 있지 않은가?
- API 라우트에서 인증 체크(Firebase Admin verifyIdToken)를 빼먹지 않았는가?
- DB 쿼리의 SQL injection 가능성은 없는가? (parameterized query 사용 여부)
- async/await 누락으로 Promise가 resolve 안 된 채 사용되지 않는가?

### 2. 🔴 실제 동작 시뮬레이션
변경된 코드에 대해 반드시 다음 시나리오를 머릿속으로 실행하세요:
- **로그인된 사용자가 API 호출**: 토큰 검증 → DB 쿼리 → 응답
- **비로그인 사용자가 API 호출**: 401 반환되는가?
- **잘못된 입력 전송**: 에러 핸들링이 되는가?
- **DB 연결 실패 시**: 에러가 적절히 처리되는가?
- **Netlify 서버리스 환경**: cold start, timeout 고려

### 3. 🔴 접근 방식 비판 (이렇게 하는 게 맞나?)
변경된 코드를 보고 반드시 질문하세요:
- **이 접근이 이 상황에 맞는가?** 더 간단하거나 안전한 방법은 없는가?
- **기존 코드를 왜 바꿨는가?** 기존 방식이 더 나은 점은 없는가?
- **새 코드가 기존 동작을 깨뜨리지 않는가?** 다른 곳에서 이 함수/변수를 참조하고 있진 않은가?
- **edge case를 고려했는가?** 빈 배열, null 반환, 네트워크 오류 등
- **TypeScript 타입 안전성**: any 남용, 타입 단언(as) 남용, 런타임 에러 가능성
- **Next.js 규칙**: 서버/클라이언트 경계, 데이터 페칭 패턴, 캐싱 전략

### 4. 버그 가능성
- null/undefined 체크 누락
- React hooks 규칙 위반 (조건부 hook, useEffect 의존성 누락)
- 메모리 누수 (cleanup 없는 useEffect)
- DOM 요소 참조 시점 문제

### 5. 보안
- SQL injection (raw query에 사용자 입력 직접 삽입)
- XSS (dangerouslySetInnerHTML, innerHTML)
- API 키/시크릿 노출 (클라이언트 번들에 서버 전용 변수 포함)
- 인증/인가 우회 가능성

### 6. 코드 품질
- 중복/미사용 코드
- 컴포넌트 분리가 적절한지
- TypeScript 타입 정의 품질

## 출력 규칙

**반드시 최소 1개 이상의 🟡 주의 또는 🔴 심각을 찾으세요.**
정말로 100% 완벽한 코드만 "✅ 통과"를 받을 수 있습니다.
"별 문제 없어 보입니다"는 금지입니다. 구체적으로 검증한 항목을 나열하세요.

## 출력 형식

🔴 심각: [문제 설명]
   위치: [파일명:관련 코드]
   재현: [이 버그가 발생하는 구체적 시나리오]
   해결: [해결 방법]

🟡 주의: [문제 설명]
   위치: [파일명:관련 코드]
   영향: [이 문제가 실제로 어떤 영향을 주는지]
   해결: [해결 방법]

🟢 개선: [개선 제안]
   위치: [파일명:관련 코드]
   제안: [개선 방법]

✅ 검증 완료: [구체적으로 확인한 항목 나열]
   - 실행 흐름: [확인한 내용]
   - 타이밍: [확인한 내용]
   - 경계값: [확인한 내용]
`;

  let userPrompt;
  if (type === 'code') {
    const fullContext = getChangedFilesContent();
    userPrompt = `## 변경사항 (diff)\n\n${content}`;
    if (fullContext) {
      userPrompt += `\n\n## 변경된 파일 전체 내용 (맥락 파악용)\n아래 전체 코드에서 변경된 부분이 어떻게 호출되는지, 실행 순서가 맞는지 확인하세요.\n${fullContext}`;
    }
  } else if (type === 'file') {
    userPrompt = `다음 파일 전체를 검수해주세요:\n\n${content}`;
  } else if (type === 'plan') {
    userPrompt = `다음 구현 계획을 검수해주세요. 프로젝트 규칙과 맞는지, 잠재적 문제가 있는지 확인:\n\n${content}`;
  }

  try {
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: userPrompt }
    ]);
    return result.response.text();
  } catch (error) {
    console.error('❌ Gemini API 오류:', error.message);
    process.exit(1);
  }
}

// 메인 실행
async function main() {
  const args = process.argv.slice(2);

  console.log('🔍 Gemini Flash 코드 검수 시작...\n');

  let content, type;

  if (args.includes('--file')) {
    const fileIndex = args.indexOf('--file') + 1;
    const filePath = args[fileIndex];
    if (!filePath) {
      console.error('❌ 파일 경로를 지정해주세요');
      process.exit(1);
    }
    console.log(`📄 파일 검수: ${filePath}\n`);
    content = `// 파일: ${filePath}\n\n${readFile(filePath)}`;
    type = 'file';
  } else if (args.includes('--plan')) {
    const planIndex = args.indexOf('--plan') + 1;
    const plan = args[planIndex];
    if (!plan) {
      console.error('❌ 계획 내용을 지정해주세요');
      process.exit(1);
    }
    console.log(`📋 계획 검수\n`);
    content = plan;
    type = 'plan';
  } else {
    console.log(`📝 Git diff 변경사항 검수\n`);
    content = getGitDiff();
    type = 'code';

    if (content === '변경사항 없음') {
      console.log('ℹ️  변경사항이 없습니다.');
      return;
    }
  }

  if (content.length > 100000) {
    console.log('⚠️  내용이 너무 깁니다. 처음 100,000자만 검수합니다.\n');
    content = content.substring(0, 100000);
  }

  const result = await reviewWithGemini(content, type);

  console.log('━'.repeat(50));
  console.log('📋 검수 결과');
  console.log('━'.repeat(50));
  console.log(result);
  console.log('━'.repeat(50));
}

main().catch(console.error);
