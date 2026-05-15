# Supertonic - 빠르고 정확한 온디바이스 TTS

[![v3 Demo](https://img.shields.io/badge/v3-Demo-yellow)](https://huggingface.co/spaces/Supertone/supertonic-3)
[![v3 Models](https://img.shields.io/badge/v3-Models-blue)](https://huggingface.co/Supertone/supertonic-3)
[![v2 Branch](https://img.shields.io/badge/v2-release%2Fsupertonic--2-lightgrey)](https://github.com/supertone-inc/supertonic/tree/release/supertonic-2)
[![v1 Demo](https://img.shields.io/badge/v1%20(old)-Demo-lightgrey)](https://huggingface.co/spaces/Supertone/supertonic#interactive-demo)
[![v1 Models](https://img.shields.io/badge/v1%20(old)-Models-lightgrey)](https://huggingface.co/Supertone/supertonic)

<p align="center">
  <img src="img/Supertonic3_HeroImage.png" alt="Supertonic 3 Banner">
</p>

**Supertonic**은 로컬 추론을 위해 설계된 초고속 온디바이스 텍스트 음성 변환(TTS) 시스템입니다. ONNX Runtime 기반으로 동작하며, 클라우드 호출이나 외부 API 없이 사용자의 기기에서 직접 음성을 생성합니다.

## 업데이트 소식

- **2026.04.29** - **Supertonic 3** 출시: 31개 언어 지원, 읽기 정확도 개선, 반복/누락 실패 감소, v2 호환 공개 ONNX 자산 제공. [Demo](https://huggingface.co/spaces/Supertone/supertonic-3) | [Models](https://huggingface.co/Supertone/supertonic-3)
- **2026.01.22** - [Voice Builder](https://supertonic.supertone.ai/voice_builder) 공개. 사용자의 목소리를 영구 소유 가능한 엣지 네이티브 TTS로 만들 수 있습니다.
- **2026.01.06** - **Supertonic 2** 출시. v2 코드 경로는 [`release/supertonic-2`](https://github.com/supertone-inc/supertonic/tree/release/supertonic-2) 브랜치에 보존되어 있습니다.
- **2025.12.10** - `supertonic` PyPI 패키지 추가. `pip install supertonic`으로 설치할 수 있습니다. 자세한 내용은 [supertonic-py 문서](https://supertone-inc.github.io/supertonic-py)를 참고하세요.
- **2025.12.10** - 새 보이스 스타일 6종(M3, M4, M5, F3, F4, F5) 추가. 자세한 내용은 [Voices](https://supertone-inc.github.io/supertonic-py/voices/)를 참고하세요.
- **2025.12.08** - [OnnxSlim](https://github.com/inisis/OnnxSlim)으로 최적화된 ONNX 모델을 [Hugging Face Models](https://huggingface.co/Supertone/supertonic)에서 제공.
- **2025.11.24** - Flutter SDK 지원과 macOS 호환성 추가.

## 빠른 시작

Python SDK를 설치하면 바로 음성을 생성할 수 있습니다. 처음 실행할 때 Supertonic이 Hugging Face에서 모델 자산을 자동으로 다운로드합니다.

```bash
pip install supertonic
```

### Python

```python
from supertonic import TTS

# 최초 실행 시 Hugging Face에서 모델을 자동 다운로드합니다.
tts = TTS(auto_download=True)

style = tts.get_voice_style(voice_name="M1")

text = "A gentle breeze moved through the open window while everyone listened to the story."
wav, duration = tts.synthesize(text, voice_style=style, lang="en")

tts.save_audio(wav, "output.wav")
print(f"Generated {duration:.2f}s of audio")
```

## 시작하기

먼저 저장소를 복제합니다.

```bash
git clone https://github.com/supertone-inc/supertonic.git
cd supertonic
```

### 사전 준비

예제를 실행하기 전에 ONNX 모델과 프리셋 보이스를 다운로드해 `assets` 디렉터리에 배치해야 합니다.

> **참고:** Hugging Face 저장소는 Git LFS를 사용합니다. 큰 모델 파일을 복제하거나 받을 수 있도록 Git LFS를 먼저 설치하고 초기화하세요.
>
> - macOS: `brew install git-lfs && git lfs install`
> - 일반 설치: `https://git-lfs.com`에서 설치 파일을 확인하세요.

```bash
git lfs install
git clone https://huggingface.co/Supertone/supertonic-3 assets
```

일부 언어 예제에는 네이티브 런타임이 필요합니다.

- **Go**: ONNX Runtime C 라이브러리가 필요합니다. macOS에서는 `brew install onnxruntime`으로 설치할 수 있으며, Go 예제는 Homebrew 경로를 자동 감지합니다.
- **Java**: JRE가 아니라 JDK가 필요합니다. macOS에서는 `brew install openjdk@17`을 사용할 수 있습니다.
- **C#**: .NET 9를 대상으로 하며 major-version roll-forward를 허용하므로 .NET 9 이상 런타임에서 실행할 수 있습니다.

Python 예제 실행:

```bash
cd py
uv sync
uv run example_onnx.py
```

기본 프리셋 보이스로 `outputs/output.wav`가 생성됩니다.

### 다른 런타임 예제

<details>
<summary><b>다른 언어와 플랫폼에서 Supertonic 실행하기</b></summary>

**Node.js 예제** ([자세히](nodejs/))

```bash
cd nodejs
npm install
npm start
```

**브라우저 예제** ([자세히](web/))

```bash
cd web
npm install
npm run dev
```

**Java 예제** ([자세히](java/))

```bash
cd java
mvn clean install
mvn exec:java
```

**C++ 예제** ([자세히](cpp/))

```bash
cd cpp
mkdir build && cd build
cmake .. && cmake --build . --config Release
./example_onnx
```

**C# 예제** ([자세히](csharp/))

```bash
cd csharp
dotnet restore
dotnet run
```

**Go 예제** ([자세히](go/))

```bash
cd go
go mod download
go run example_onnx.go helper.go
```

**Swift 예제** ([자세히](swift/))

```bash
cd swift
swift build -c release
.build/release/example_onnx
```

**Rust 예제** ([자세히](rust/))

```bash
cd rust
cargo build --release
./target/release/example_onnx
```

**iOS 예제** ([자세히](ios/))

```bash
cd ios/ExampleiOSApp
xcodegen generate
open ExampleiOSApp.xcodeproj
```

Xcode에서 Targets -> ExampleiOSApp -> Signing으로 이동해 Team을 선택한 뒤, iPhone을 실행 대상으로 선택하고 빌드합니다.

</details>

## 기술 개요

- **런타임**: 크로스 플랫폼 추론을 위한 ONNX Runtime
- **브라우저 지원**: 클라이언트 측 추론을 위한 onnxruntime-web
- **배치 처리**: 처리량 향상을 위한 batch inference 지원
- **오디오 출력**: 16-bit WAV 파일 출력

## 성능 하이라이트

Supertonic 3는 실용적인 온디바이스 추론을 목표로 설계되었습니다. 로컬 실행에 충분히 가볍고, 훨씬 큰 공개 TTS 시스템들과 비교해도 경쟁력 있는 품질을 제공합니다.

### 읽기 정확도

<p align="center">
  <img src="img/metrics/s3_vs_measured_wer_range_voxcpm2.png" alt="Supertonic 3 reading accuracy compared with measured model ranges and VoxCPM2">
</p>

측정된 언어 범위에서 Supertonic 3는 VoxCPM2 같은 더 큰 공개 TTS 모델과 비교해 경쟁력 있는 WER/CER 범위를 유지하면서도 가벼운 온디바이스 배포 경로를 제공합니다. 별표가 붙은 언어는 CER, 나머지는 WER 기준입니다.

### Supertonic 2에서 Supertonic 3로

<p align="center">
  <img src="img/metrics/supertonic2_vs_3_comparison.png" alt="Supertonic 2 and Supertonic 3 comparison">
</p>

Supertonic 3는 Supertonic 2 대비 반복/누락 실패를 줄이고, 공통 언어 세트에서 화자 유사도를 개선했으며, 언어 지원 범위를 5개에서 31개로 확장했습니다. 공개 ONNX 인터페이스는 v2와 호환되므로 기존 통합은 같은 추론 계약으로 v3로 이동할 수 있습니다.

### 런타임 풋프린트

<p align="center">
  <img src="img/metrics/runtime_cpu_gpu_latency_memory.png" alt="Supertonic CPU runtime compared with GPU baselines">
</p>

Supertonic 3는 A100 GPU에서 측정된 더 큰 기준 모델들과 비교해도 CPU에서 빠르게 동작하며, 메모리 사용량도 낮습니다. 공개 fixed-voice 설정에서는 GPU가 필요하지 않아 로컬, 브라우저, 엣지 배포가 쉬워집니다.

### 모델 크기

<p align="center">
  <img src="img/metrics/model_size_comparison.png" alt="Model size comparison">
</p>

공개 ONNX 자산 전체 기준 약 99M 파라미터 규모로, 0.7B-2B급 공개 TTS 시스템보다 훨씬 작습니다. 작은 모델 크기는 다운로드 크기, 시작 시간, 온디바이스 추론 측면에서 실용적인 장점입니다.

## 데모

> **바로 체험하기**: [Interactive Demo](https://huggingface.co/spaces/Supertone/supertonic-3)에서 브라우저로 Supertonic을 체험하거나 [Hugging Face Hub](https://huggingface.co/Supertone/supertonic-3)에서 사전 학습 모델을 사용할 수 있습니다.

### Raspberry Pi

Raspberry Pi에서 실행되는 Supertonic 데모입니다. 온디바이스 실시간 TTS 합성을 보여줍니다.

https://github.com/user-attachments/assets/ea66f6d6-7bc5-4308-8a88-1ce3e07400d2

### E-Reader

비행기 모드의 Onyx Boox Go 6 전자책 리더에서 Supertonic을 실행한 예시입니다. 네트워크 없이 평균 RTF 0.3x를 달성합니다.

https://github.com/user-attachments/assets/64980e58-ad91-423a-9623-78c2ffc13680

### Chrome Extension

어떤 웹페이지든 1초 이내에 오디오로 변환하는 온디바이스 TTS 확장 프로그램 예시입니다.

https://github.com/user-attachments/assets/cc8a45fc-5c3e-4b2c-8439-a14c3d00d91c

## Supertonic을 선택하는 이유

- **빠른 속도**: 데스크톱, 브라우저, 엣지 배포에서 낮은 지연 시간으로 음성을 생성하도록 최적화
- **가벼운 모델**: 효율적인 로컬 실행을 위해 설계된 compact ONNX 자산
- **온디바이스 실행**: 개인정보 보호와 네트워크 의존성 제거
- **정확한 읽기**: 반복 및 누락 실패를 줄인 안정적인 읽기 성능
- **표현 태그**: `<laugh>`, `<breath>`, `<sigh>` 같은 간단한 표현 태그 지원
- **유연한 배포**: Python, JavaScript, 브라우저, 모바일, 네이티브 런타임 예제 제공

## 언어 지원

Supertonic 3는 31개 언어를 지원합니다.

| Code | Language | Code | Language | Code | Language | Code | Language |
|------|----------|------|----------|------|----------|------|----------|
| `en` | English | `ko` | Korean | `ja` | Japanese | `ar` | Arabic |
| `bg` | Bulgarian | `cs` | Czech | `da` | Danish | `de` | German |
| `el` | Greek | `es` | Spanish | `et` | Estonian | `fi` | Finnish |
| `fr` | French | `hi` | Hindi | `hr` | Croatian | `hu` | Hungarian |
| `id` | Indonesian | `it` | Italian | `lt` | Lithuanian | `lv` | Latvian |
| `nl` | Dutch | `pl` | Polish | `pt` | Portuguese | `ro` | Romanian |
| `ru` | Russian | `sk` | Slovak | `sl` | Slovenian | `sv` | Swedish |
| `tr` | Turkish | `uk` | Ukrainian | `vi` | Vietnamese | | |

## 예제 목록

여러 생태계에서 바로 사용할 수 있는 TTS 추론 예제를 제공합니다.

| 언어/플랫폼 | 경로 | 설명 |
|-------------|------|------|
| [**Python**](py/) | `py/` | ONNX Runtime 추론 |
| [**Node.js**](nodejs/) | `nodejs/` | 서버 측 JavaScript |
| [**Browser**](web/) | `web/` | WebGPU/WASM 추론 |
| [**Java**](java/) | `java/` | 크로스 플랫폼 JVM |
| [**C++**](cpp/) | `cpp/` | 고성능 C++ |
| [**C#**](csharp/) | `csharp/` | .NET 생태계 |
| [**Go**](go/) | `go/` | Go 구현 |
| [**Swift**](swift/) | `swift/` | macOS 애플리케이션 |
| [**iOS**](ios/) | `ios/` | 네이티브 iOS 앱 |
| [**Rust**](rust/) | `rust/` | 메모리 안전 시스템 언어 |
| [**Flutter**](flutter/) | `flutter/` | 크로스 플랫폼 앱 |

> 자세한 사용법은 각 언어 디렉터리의 README.md를 참고하세요.

## 자연어 텍스트 처리

Supertonic은 자연스러운 문장, 구두점, 약어, 고유명사를 포함하는 실제 텍스트 입력을 처리하도록 설계되었습니다.

> **오디오 샘플 보기**: 모든 오디오 예제를 더 편하게 보려면 [Interactive Demo](https://huggingface.co/spaces/Supertone/supertonic-3)를 확인하세요.

**테스트 케이스 개요**

| 카테고리 | 주요 난점 | Supertonic | ElevenLabs | OpenAI | Gemini | Microsoft |
|:--------:|:----------:|:----------:|:----------:|:------:|:------:|:---------:|
| 금융 표현 | 소수 통화, 축약 단위(M, K), 통화 기호, 통화 코드 | 성공 | 실패 | 실패 | 실패 | 실패 |
| 전화번호 | 지역번호, 하이픈, 내선(ext.) | 성공 | 실패 | 실패 | 실패 | 실패 |
| 기술 단위 | 단위가 붙은 소수, 축약 기술 표기 | 성공 | 실패 | 실패 | 실패 | 실패 |

<details>
<summary><b>예제 1: 금융 표현</b></summary>

<br>

**텍스트**

> "The startup secured **$5.2M** in venture capital, a huge leap from their initial **$450K** seed round."

**난점**

- `$5.2M`을 "five point two million"으로 읽어야 하는 소수 통화 표현
- million을 뜻하는 M, thousand를 뜻하는 K 같은 축약 단위
- dollars로 적절히 읽어야 하는 `$` 통화 기호

**오디오 샘플**

| System | Result | Audio Sample |
|--------|--------|--------------|
| **Supertonic** | 성공 | [Play Audio](https://drive.google.com/file/d/1eancUOhiSXCVoTu9ddh4S-OcVQaWrPV-/view?usp=sharing) |
| ElevenLabs Flash v2.5 | 실패 | [Play Audio](https://drive.google.com/file/d/1-r2scv7XQ1crIDu6QOh3eqVl445W6ap_/view?usp=sharing) |
| OpenAI TTS-1 | 실패 | [Play Audio](https://drive.google.com/file/d/1MFDXMjfmsAVOqwPx7iveS0KUJtZvcwxB/view?usp=sharing) |
| Gemini 2.5 Flash TTS | 실패 | [Play Audio](https://drive.google.com/file/d/1dEHpNzfMUucFTJPQK0k4RcFZvPwQTt09/view?usp=sharing) |
| VibeVoice Realtime 0.5B | 실패 | [Play Audio](https://drive.google.com/file/d/1b69XWBQnSZZ0WZeR3avv7E8mSdoN6p6P/view?usp=sharing) |

</details>

<details>
<summary><b>예제 2: 전화번호</b></summary>

<br>

**텍스트**

> "You can reach the hotel front desk at **(212) 555-0142 ext. 402** anytime."

**난점**

- 각각의 숫자로 읽어야 하는 괄호 안 지역번호
- 하이픈으로 구분된 전화번호
- `ext.` 내선 표기
- 내선 번호 `402`

**오디오 샘플**

| System | Result | Audio Sample |
|--------|--------|--------------|
| **Supertonic** | 성공 | [Play Audio](https://drive.google.com/file/d/1z-e5iTsihryMR8ll1-N1YXkB2CIJYJ6F/view?usp=sharing) |
| ElevenLabs Flash v2.5 | 실패 | [Play Audio](https://drive.google.com/file/d/1HAzVXFTZfZm0VEK2laSpsMTxzufcuaxA/view?usp=sharing) |
| OpenAI TTS-1 | 실패 | [Play Audio](https://drive.google.com/file/d/15tjfAmb3GbjP_kmvD7zSdIWkhtAaCPOg/view?usp=sharing) |
| Gemini 2.5 Flash TTS | 실패 | [Play Audio](https://drive.google.com/file/d/1BCL8n7yligUZyso970ud7Gf5NWb1OhKD/view?usp=sharing) |
| VibeVoice Realtime 0.5B | 실패 | [Play Audio](https://drive.google.com/file/d/1c0c0YM_Qm7XxSk2uSVYLbITgEDTqaVzL/view?usp=sharing) |

</details>

<details>
<summary><b>예제 3: 기술 단위</b></summary>

<br>

**텍스트**

> "Our drone battery lasts **2.3h** when flying at **30kph** with full camera payload."

**난점**

- `2.3h`를 "two point three hours"로 읽어야 하는 소수 시간 표현
- `30kph`를 "thirty kilometers per hour"로 읽어야 하는 속도 단위
- h, kph 같은 기술 약어
- 기술/공학 문맥에 맞는 발음

**오디오 샘플**

| System | Result | Audio Sample |
|--------|--------|--------------|
| **Supertonic** | 성공 | [Play Audio](https://drive.google.com/file/d/1kvOBvswFkLfmr8hGplH0V2XiMxy1shYf/view?usp=sharing) |
| ElevenLabs Flash v2.5 | 실패 | [Play Audio](https://drive.google.com/file/d/1_SzfjWJe5YEd0t3R7DztkYhHcI_av48p/view?usp=sharing) |
| OpenAI TTS-1 | 실패 | [Play Audio](https://drive.google.com/file/d/1P5BSilj5xFPTV2Xz6yW5jitKZohO9o-6/view?usp=sharing) |
| Gemini 2.5 Flash TTS | 실패 | [Play Audio](https://drive.google.com/file/d/1GU82SnWC50OvC8CZNjhxvNZFKQb7I9_Y/view?usp=sharing) |
| VibeVoice Realtime 0.5B | 실패 | [Play Audio](https://drive.google.com/file/d/1lUTrxrAQy_viEK2Hlu3KLLtTCe8jvbdV/view?usp=sharing) |

</details>

> **참고:** 이 샘플들은 각 시스템이 별도 전처리나 발음 주석 없이 복잡한 표현의 텍스트 정규화와 발음을 어떻게 처리하는지 보여줍니다.

## Supertonic을 사용한 프로젝트

| 프로젝트 | 설명 | 링크 |
|---------|------|------|
| **TLDRL** | 모든 웹페이지를 읽어주는 무료 온디바이스 TTS 확장 프로그램 | [Chrome](https://chromewebstore.google.com/detail/tldrl-lightning-tts-power/mdbiaajonlkomihpcaffhkagodbcgbme) |
| **Read Aloud** | 오픈소스 TTS 브라우저 확장 프로그램 | [Chrome](https://chromewebstore.google.com/detail/read-aloud-a-text-to-spee/hdhinadidafjejdhmfkjgnolgimiaplp) · [Edge](https://microsoftedge.microsoft.com/addons/detail/read-aloud-a-text-to-spe/pnfonnnmfjnpfgagnklfaccicnnjcdkm) · [GitHub](https://github.com/ken107/read-aloud) |
| **PageEcho** | iOS 전자책 리더 앱 | [App Store](https://apps.apple.com/us/app/pageecho/id6755965837) |
| **VoiceChat** | 브라우저에서 실행되는 온디바이스 voice-to-voice LLM 챗봇 | [Demo](https://huggingface.co/spaces/RickRossTN/ai-voice-chat) · [GitHub](https://github.com/irelate-ai/voice-chat) |
| **OmniAvatar** | 사진과 음성으로 만드는 talking avatar 비디오 생성기 | [Demo](https://huggingface.co/spaces/alexnasa/OmniAvatar) |
| **CopiloTTS** | ONNX Runtime 기반 Kotlin Multiplatform TTS SDK | [GitHub](https://github.com/sigmadeltasoftware/CopiloTTS) |
| **Voice Mixer** | 보이스 스타일을 혼합하고 수정하는 PyQt5 도구 | [GitHub](https://github.com/Topping1/Supertonic-Voice-Mixer) |
| **Supertonic MNN** | MNN 기반 경량 라이브러리(fp32/fp16/int8) | [GitHub](https://github.com/vra/supertonic-mnn) · [PyPI](https://pypi.org/project/supertonic-mnn/) |
| **Transformers.js** | Supertonic을 지원하는 Hugging Face JS 라이브러리 | [GitHub PR](https://github.com/huggingface/transformers.js/pull/1459) · [Demo](https://huggingface.co/spaces/webml-community/Supertonic-TTS-WebGPU) |
| **Pinokio** | Mac, Windows, Linux용 1-click localhost cloud | [Pinokio](https://pinokio.co/) · [GitHub](https://github.com/SUP3RMASS1VE/SuperTonic-TTS) |

## 인용

다음 논문들은 Supertonic에 사용된 핵심 기술을 설명합니다. 연구에 사용하거나 관련 기법이 유용했다면 해당 논문 인용을 고려해 주세요.

### SupertonicTTS: 메인 아키텍처

이 논문은 speech autoencoder, flow-matching 기반 text-to-latent 모듈, 효율적인 설계 선택을 포함한 SupertonicTTS의 전체 아키텍처를 소개합니다.

```bibtex
@article{kim2025supertonic,
  title={SupertonicTTS: Towards Highly Efficient and Streamlined Text-to-Speech System},
  author={Kim, Hyeongju and Yang, Jinhyeok and Yu, Yechan and Ji, Seunghun and Morton, Jacob and Bous, Frederik and Byun, Joon and Lee, Juheon},
  journal={arXiv preprint arXiv:2503.23108},
  year={2025},
  url={https://arxiv.org/abs/2503.23108}
}
```

### Length-Aware RoPE: 텍스트-음성 정렬

이 논문은 cross-attention 메커니즘에서 텍스트-음성 정렬을 개선하는 Length-Aware Rotary Position Embedding(LARoPE)을 제안합니다.

```bibtex
@article{kim2025larope,
  title={Length-Aware Rotary Position Embedding for Text-Speech Alignment},
  author={Kim, Hyeongju and Lee, Juheon and Yang, Jinhyeok and Morton, Jacob},
  journal={arXiv preprint arXiv:2509.11084},
  year={2025},
  url={https://arxiv.org/abs/2509.11084}
}
```

### Self-Purifying Flow Matching: 노이즈 라벨 학습

이 논문은 노이즈가 있거나 신뢰하기 어려운 라벨로 flow matching 모델을 안정적으로 학습하기 위한 self-purification 기법을 설명합니다.

```bibtex
@article{kim2025spfm,
  title={Training Flow Matching Models with Reliable Labels via Self-Purification},
  author={Kim, Hyeongju and Yu, Yechan and Yi, June Young and Lee, Juheon},
  journal={arXiv preprint arXiv:2509.19091},
  year={2025},
  url={https://arxiv.org/abs/2509.19091}
}
```

## 라이선스

이 프로젝트의 샘플 코드는 MIT License로 배포됩니다. 자세한 내용은 [LICENSE](https://github.com/supertone-inc/supertonic?tab=MIT-1-ov-file)를 참고하세요.

함께 제공되는 모델은 OpenRAIL-M License로 배포됩니다. 자세한 내용은 Hugging Face의 [LICENSE](https://huggingface.co/Supertone/supertonic-3/blob/main/LICENSE)를 참고하세요.

이 모델은 PyTorch로 학습되었으며, PyTorch는 BSD 3-Clause License를 따릅니다. PyTorch 자체는 이 프로젝트에 재배포되지 않습니다. 자세한 내용은 [PyTorch license](https://docs.pytorch.org/FBGEMM/general/License.html)를 참고하세요.

Copyright (c) 2026 Supertone Inc.
