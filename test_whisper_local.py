#!/usr/bin/env python3
"""
测试本地Whisper功能的脚本

使用方法:
python3 test_whisper_local.py [--audio-file path/to/audio.mp4] [--model medium.en]

如果没有提供音频文件，会创建一个测试音频文件进行测试。
"""

import argparse
import os
import sys
import tempfile
import wave
import numpy as np
import json

def create_test_audio(filename, duration=5, sample_rate=16000):
    """创建一个简单的测试音频文件"""
    try:
        import torch
        import torchaudio

        # 创建一个简单的正弦波音频
        t = np.linspace(0, duration, int(sample_rate * duration))
        # 生成440Hz的正弦波（A4音符）
        audio_data = 0.3 * np.sin(2 * np.pi * 440 * t)

        # 添加一些语音频率的噪声来模拟语音
        noise = 0.1 * np.random.randn(len(audio_data))
        audio_data += noise

        # 转换为tensor
        audio_tensor = torch.from_numpy(audio_data).float().unsqueeze(0)

        # 保存为音频文件
        torchaudio.save(filename, audio_tensor, sample_rate)
        print(f"✅ 创建测试音频文件: {filename}")
        return True

    except ImportError:
        print("❌ 无法导入torchaudio，尝试使用wave模块...")
        try:
            # 使用wave模块创建简单的音频
            with wave.open(filename, 'wb') as wav_file:
                wav_file.setnchannels(1)  # 单声道
                wav_file.setsampwidth(2)  # 16位
                wav_file.setframerate(sample_rate)

                # 创建简单的音频数据
                audio_data = (np.sin(2 * np.pi * 440 * np.linspace(0, duration, int(sample_rate * duration))) * 32767).astype(np.int16)
                wav_file.writeframes(audio_data.tobytes())

            print(f"✅ 创建测试音频文件: {filename}")
            return True

        except Exception as e:
            print(f"❌ 创建音频文件失败: {e}")
            return False

def test_whisper_import():
    """测试Whisper是否可以导入"""
    try:
        import whisper
        print(f"✅ Whisper导入成功，版本: {whisper.__version__}")
        return True
    except ImportError as e:
        print(f"❌ Whisper导入失败: {e}")
        return False

def test_torch_import():
    """测试PyTorch是否可以导入"""
    try:
        import torch
        print(f"✅ PyTorch导入成功，版本: {torch.__version__}")

        # 检查MPS可用性
        if hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            print("✅ MPS (Apple Silicon GPU) 可用")
        elif torch.cuda.is_available():
            print(f"✅ CUDA GPU 可用，设备数量: {torch.cuda.device_count()}")
        else:
            print("ℹ️  使用CPU进行推理")

        return True
    except ImportError as e:
        print(f"❌ PyTorch导入失败: {e}")
        return False

def test_whisper_transcription(audio_file, model_name='tiny.en'):
    """测试Whisper转录功能"""
    try:
        import whisper
        import time

        print(f"🔄 开始转录测试: {audio_file} (模型: {model_name})")
        start_time = time.time()

        # 加载模型
        print("⏳ 加载模型...")
        model = whisper.load_model(model_name)

        # 执行转录
        print("🎤 开始转录...")
        result = model.transcribe(
            audio_file,
            language='en',
            fp16=False  # 使用float32提高兼容性
        )

        end_time = time.time()

        # 显示结果
        print(f"✅ 转录完成！")
        print(f"⏱️  总耗时: {end_time - start_time:.2f}秒")
        print(f"📝 转录文本: {result['text'].strip()}")
        print(f"🌐 检测语言: {result['language']}")
        print(f"🎵 音频时长: {result.get('duration', 'unknown'):.2f}秒")

        if result.get('segments'):
            print(f"📊 分段数量: {len(result['segments'])}")

        return True, result

    except Exception as e:
        print(f"❌ 转录失败: {e}")
        return False, None

def main():
    parser = argparse.ArgumentParser(description='测试本地Whisper功能')
    parser.add_argument('--audio-file', help='音频文件路径')
    parser.add_argument('--model', default='tiny.en',
                       choices=['tiny.en', 'base.en', 'small.en', 'medium.en', 'large-v3', 'large-v3-turbo'],
                       help='Whisper模型名称')
    parser.add_argument('--create-test-audio', action='store_true',
                       help='创建测试音频文件')

    args = parser.parse_args()

    print("🚀 开始测试本地Whisper环境...")
    print("=" * 50)

    # 测试导入
    print("\n1. 测试依赖导入...")
    import_ok = test_torch_import() and test_whisper_import()

    if not import_ok:
        print("\n❌ 依赖测试失败，请安装所需包:")
        print("pip install openai-whisper torch torchaudio")
        sys.exit(1)

    # 处理音频文件
    audio_file = args.audio_file
    if not audio_file:
        if args.create_test_audio:
            # 创建临时测试音频
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
                audio_file = tmp_file.name

            if not create_test_audio(audio_file):
                sys.exit(1)

            print(f"📁 使用测试音频文件: {audio_file}")
        else:
            print("\n❌ 请提供音频文件路径或使用 --create-test-audio 创建测试音频")
            sys.exit(1)
    else:
        if not os.path.exists(audio_file):
            print(f"❌ 音频文件不存在: {audio_file}")
            sys.exit(1)

    # 测试转录
    print(f"\n2. 测试Whisper转录...")
    success, result = test_whisper_transcription(audio_file, args.model)

    if success:
        print(f"\n🎉 测试成功！")
        print(f"✅ 本地Whisper环境配置正确")
        print(f"✅ 模型 '{args.model}' 可以正常使用")

        # 保存结果到文件
        if args.audio_file:  # 只有在真实音频文件时才保存
            result_file = f"{os.path.splitext(args.audio_file)[0]}_transcript.json"
            with open(result_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            print(f"💾 结果已保存到: {result_file}")
    else:
        print(f"\n❌ 测试失败")
        print(f"❌ 请检查模型安装和文件格式")
        sys.exit(1)

    # 清理临时文件
    if args.create_test_audio and os.path.exists(audio_file):
        os.unlink(audio_file)
        print(f"🗑️  清理临时文件: {audio_file}")

if __name__ == "__main__":
    main()