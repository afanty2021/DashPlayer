#!/usr/bin/env python3
"""
DashPlayer Whisper本地转录脚本

功能：
- 调用本地Whisper模型进行语音识别
- 支持多种模型和参数配置
- 返回结构化的JSON格式结果
- 支持进度显示和错误处理
"""

import argparse
import json
import sys
import os
import time
from pathlib import Path

try:
    import whisper
    import torch
except ImportError as e:
    print(json.dumps({
        "error": f"依赖包未安装: {e}",
        "install_hint": "请运行: pip install openai-whisper torch"
    }), file=sys.stderr)
    sys.exit(1)


def check_device():
    """检测最佳可用设备"""
    if torch.backends.mps.is_available():
        return "mps"  # Apple Silicon GPU
    elif torch.cuda.is_available():
        return "cuda"  # NVIDIA GPU
    else:
        return "cpu"


def load_whisper_model(model_name):
    """加载Whisper模型"""
    print(f"正在加载Whisper模型: {model_name}", file=sys.stderr)
    start_time = time.time()

    try:
        # 检测设备并加载模型
        device = check_device()
        print(f"使用设备: {device}", file=sys.stderr)

        model = whisper.load_model(
            model_name,
            device=device,
            fp16=False if device == "mps" else True  # MPS在float32下性能更好
        )

        load_time = time.time() - start_time
        print(f"模型加载完成，耗时: {load_time:.2f}秒", file=sys.stderr)
        return model

    except Exception as e:
        print(json.dumps({
            "error": f"模型加载失败: {e}",
            "model": model_name
        }), file=sys.stderr)
        sys.exit(1)


def transcribe_audio(model, audio_path, language=None, task="transcribe"):
    """执行音频转录"""
    print(f"开始转录音频: {audio_path}", file=sys.stderr)
    start_time = time.time()

    try:
        # 执行转录
        options = {
            "task": task,
            "fp16": False,  # 统一使用float32以提高兼容性
            "verbose": False
        }

        if language:
            options["language"] = language

        result = model.transcribe(audio_path, **options)

        transcribe_time = time.time() - start_time
        duration = result.get("duration", 0)

        # 计算转录速度
        if duration > 0:
            speed_ratio = duration / transcribe_time
            print(f"转录完成，耗时: {transcribe_time:.2f}秒", file=sys.stderr)
            print(f"音频时长: {duration:.2f}秒，实时率: {speed_ratio:.2f}x", file=sys.stderr)

        return result

    except Exception as e:
        print(json.dumps({
            "error": f"转录失败: {e}",
            "audio_path": audio_path
        }), file=sys.stderr)
        sys.exit(1)


def format_result(result):
    """格式化转录结果为标准格式"""
    formatted = {
        "language": result.get("language", "en"),
        "duration": result.get("duration", 0),
        "text": result.get("text", "").strip(),
        "segments": []
    }

    # 处理segments
    for segment in result.get("segments", []):
        formatted_segment = {
            "seek": segment.get("seek", 0),
            "start": segment.get("start", 0),
            "end": segment.get("end", 0),
            "text": segment.get("text", "").strip()
        }

        # 添加词级别时间戳（如果存在）
        if "words" in segment:
            formatted_segment["words"] = [
                {
                    "start": word.get("start", 0),
                    "end": word.get("end", 0),
                    "word": word.get("word", ""),
                    "probability": word.get("probability", 0)
                }
                for word in segment["words"]
            ]

        formatted["segments"].append(formatted_segment)

    return formatted


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="DashPlayer Whisper转录脚本")
    parser.add_argument("audio_file", help="音频文件路径")
    parser.add_argument("--model", default="medium.en",
                       choices=["tiny.en", "base.en", "small.en", "medium.en", "large-v3", "large-v3-turbo"],
                       help="Whisper模型名称")
    parser.add_argument("--language", help="指定语言代码（如en, zh等）")
    parser.add_argument("--task", default="transcribe",
                       choices=["transcribe", "translate"],
                       help="任务类型：转录或翻译")
    parser.add_argument("--output-format", default="json",
                       choices=["json", "text"],
                       help="输出格式")

    args = parser.parse_args()

    # 验证音频文件
    audio_path = Path(args.audio_file)
    if not audio_path.exists():
        print(json.dumps({
            "error": f"音频文件不存在: {args.audio_file}"
        }), file=sys.stderr)
        sys.exit(1)

    if not audio_path.is_file():
        print(json.dumps({
            "error": f"路径不是文件: {args.audio_file}"
        }), file=sys.stderr)
        sys.exit(1)

    try:
        # 加载模型
        model = load_whisper_model(args.model)

        # 执行转录
        result = transcribe_audio(
            model,
            str(audio_path),
            language=args.language,
            task=args.task
        )

        # 格式化并输出结果
        formatted_result = format_result(result)

        if args.output_format == "json":
            print(json.dumps(formatted_result, ensure_ascii=False, indent=2))
        else:
            print(formatted_result["text"])

        print(f"转录任务完成", file=sys.stderr)

    except KeyboardInterrupt:
        print(json.dumps({
            "error": "用户中断转录"
        }), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            "error": f"未知错误: {e}"
        }), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()