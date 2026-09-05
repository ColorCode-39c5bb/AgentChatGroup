import asyncio
from collections.abc import AsyncGenerator

def inner_gen():
    yield "中间数据"
    return "最终结果"  # 这个值会作为 StopAsyncIteration 的 value

def main():
    g = inner_gen();
    v = None;
    while True:
        try:
            r = next(g);
            yield r;
        except StopIteration as e:
            e.value = "改后结果"
            print(f"捕获到最终返回值: {e.value}");
            v = e.value;
            break;
    return v;


for i in main():
    print(i)