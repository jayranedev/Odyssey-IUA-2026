# from openrouter import OpenRouter
# import os

# with OpenRouter(
#   api_key="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",
# ) as client:
#   response = client.chat.send(
#     model="nousresearch/hermes-3-llama-3.1-405b:free",
#     messages=[
#       {
#         "role": "user",
#         "content": "What is the meaning of life?"
#       }
#     ]
#   )

#   print(response.choices[0].message.content)

# from openai import OpenAI

# client = OpenAI(
#   base_url="https://openrouter.ai/api/v1",
#   api_key="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",
# )

# # First API call with reasoning
# response = client.chat.completions.create(
#   model="tencent/hy3-preview:free",
#   messages=[
#           {
#             "role": "user",
#             "content": "How many r's are in the word 'strawberry'?"
#           }
#         ],
#   extra_body={"reasoning": {"enabled": True}}
# )

# # Extract the assistant message with reasoning_details
# response = response.choices[0].message

# # Preserve the assistant message with reasoning_details
# messages = [
#   {"role": "user", "content": "How many r's are in the word 'strawberry'?"},
#   {
#     "role": "assistant",
#     "content": response.content,
#     "reasoning_details": response.reasoning_details  # Pass back unmodified
#   },
#   {"role": "user", "content": "Are you sure? Think carefully."}
# ]

# # Second API call - model continues reasoning from where it left off
# response2 = client.chat.completions.create(
#   model="tencent/hy3-preview:free",
#   messages=messages,
#   extra_body={"reasoning": {"enabled": True}}
# )

from openai import OpenAI

client = OpenAI(
  base_url="https://openrouter.ai/api/v1",
  api_key="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",
)

# First API call with reasoning
response = client.chat.completions.create(
  model="google/gemma-4-31b-it:free",
  messages=[
          {
            "role": "user",
            "content": "How many r's are in the word 'strawberry'?"
          }
        ],
  extra_body={"reasoning": {"enabled": True}}
)

# Extract the assistant message with reasoning_details
response = response.choices[0].message

# Preserve the assistant message with reasoning_details
messages = [
  {"role": "user", "content": "How many r's are in the word 'strawberry'?"},
  {
    "role": "assistant",
    "content": response.content,
    "reasoning_details": response.reasoning_details  # Pass back unmodified
  },
  {"role": "user", "content": "Are you sure? Think carefully."}
]

# Second API call - model continues reasoning from where it left off
response2 = client.chat.completions.create(
  model="google/gemma-4-31b-it:free",
  messages=messages,
  extra_body={"reasoning": {"enabled": True}}
)