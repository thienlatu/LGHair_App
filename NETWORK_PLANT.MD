IMPLEMENTATION PLAN — NETWORK RESILIENCE ARCHITECTURE FOR LGHAIR
1. Mục tiêu cuối cùng

Mục tiêu của implementation này không phải là “thêm NetInfo vào app”, mà là xây một tầng network có trách nhiệm rõ ràng để xử lý toàn bộ các tình huống:

Mất Wi-Fi
Mất 4G/5G
Wi-Fi → 4G
4G → Wi-Fi
Mạng chập chờn
Request timeout
Server 5xx
Request cũ trả về muộn
User bấm mutation nhiều lần
App background → foreground
Token hết hạn trong lúc network bất ổn

Kết quả mong muốn là:

READ / GET
→ tự phát hiện network
→ tự recovery
→ retry có kiểm soát
→ không cần user bấm Retry trong các lỗi tạm thời


WRITE / MUTATION
→ không retry mù
→ không double-submit
→ timeout không tự coi là FAILED
→ không tự xóa dữ liệu business
→ cảnh báo user khi không thể xác định kết quả


UI
→ không tự xử lý AxiosError
→ không tự check "Network Error"
→ không chứa logic retry

Đồng thời kiến trúc phải tương thích hoàn toàn với Backend hiện tại, tức là hiện tại Backend chưa có:

Idempotency-Key
Operation Status API

nên Mobile không được giả định hai tính năng này đã tồn tại.

2. Kiến trúc cuối cùng

Kiến trúc nên chốt như sau:

                         ┌──────────────────────┐
                         │    React Native UI   │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Hooks / Zustand      │
                         │ State / Mutation      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Services        │
                         │ Product / Booking /   │
                         │ Order / Checkout      │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      API Client      │
                         │        Axios         │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼
                 Timeout      Error Classifier   Request Policy
                                                    │
                                                    │
                    ┌───────────────────────────────┘
                    │
                    ▼
          ┌─────────────────────────┐
          │     NetworkManager      │
          │         NetInfo         │
          └────────────┬────────────┘
                       │
                network state
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
          OFFLINE  RECONNECTING ONLINE
                                  │
                                  ▼
                         Recovery / Refetch

Quan trọng: NetworkManager không nằm trên đường đi của từng HTTP request. Nó là một service độc lập cung cấp trạng thái mạng.

Nói ngắn gọn:

NetworkManager  = mạng đang thế nào?
API Client      = HTTP request chạy thế nào?
ErrorClassifier = lỗi này là loại gì?
RequestPolicy   = operation này có được retry không?
Store           = business state đang ở đâu?
UI              = hiển thị gì?
3. Cấu trúc thư mục đề xuất

Không cần rewrite project, chỉ bổ sung tầng network:

src/
├── network/
│   ├── NetworkManager.ts
│   ├── networkTypes.ts
│   ├── errorClassifier.ts
│   ├── retryPolicy.ts
│   ├── requestContext.ts
│   └── networkRecovery.ts
│
├── services/
│   ├── apiClient.ts
│   ├── productApi.ts
│   ├── bookingApi.ts
│   ├── checkoutApi.ts
│   ├── orderApi.ts
│   └── userApi.ts
│
├── stores/
│   ├── useDataStore.ts
│   ├── useBookingStore.ts
│   ├── useCheckoutStore.ts
│   └── useAuthStore.ts
│
├── hooks/
│   ├── useNetworkStatus.ts
│   └── useAppLifecycle.ts
│
└── components/
    └── network/
        ├── NetworkBanner.tsx
        └── NetworkErrorState.tsx

Không bắt buộc đúng tên này. Quan trọng là separation of responsibility.

4. Phase 0 — Audit trước khi sửa code

Không được cho AI code ngay.

Trước tiên bắt AI kiểm tra chính xác project hiện tại:

package.json
app/_layout.tsx
src/services/apiClient.ts
src/services/bookingApi.ts
checkout/payment.tsx
order service
auth interceptor
failedQueue
Zustand stores
existing error handling
existing UUID utilities
existing NetInfo/network utilities

AI phải trả lời:

1. Axios instance nằm ở đâu?
2. Có bao nhiêu Axios instance?
3. Có bao nhiêu nơi gọi fetch/axios trực tiếp?
4. Token refresh nằm ở đâu?
5. failedQueue hoạt động thế nào?
6. Các mutation Booking/Order/Payment nằm ở đâu?
7. Có UUID generator chưa?
8. Có NetInfo chưa?
9. Có AbortController chưa?
10. Có logic retry chưa?
11. Có chỗ nào đang check "Network Error" trực tiếp?
12. Có request nào update Zustand sau khi component đã unmount?

Mục tiêu của Phase 0 là không tạo duplicate architecture.

5. Phase P0 — Network Foundation
5.1 NetworkManager

Cài:

@react-native-community/netinfo

Tạo:

src/network/NetworkManager.ts

NetworkManager phải cung cấp tối thiểu:

isConnected
isInternetReachable
connectionType
status

Trong đó status chuẩn hóa thành:

ONLINE
OFFLINE
RECONNECTING

Ví dụ:

Wi-Fi đang hoạt động
→ ONLINE


Wi-Fi mất
→ OFFLINE


4G vừa xuất hiện, đang xác nhận Internet
→ RECONNECTING


Internet xác nhận được
→ ONLINE

Không cho từng screen tự gọi NetInfo.addEventListener().

Chỉ có một global listener.

6. Global Network UX

Tại:

app/_layout.tsx

mount network provider/manager và render:

NetworkBanner
OFFLINE

Hiển thị:

Không có kết nối Internet

RECONNECTING

Hiển thị:

Đang kết nối lại...

ONLINE

Banner biến mất.

Nhưng không được biến Offline Banner thành một popup chặn toàn bộ app.

Người dùng vẫn có thể:

xem dữ liệu cache
điều hướng
xem lịch sử
xem sản phẩm

Các thao tác cần server mới bị xử lý riêng.

7. ErrorClassifier

Tạo:

src/network/errorClassifier.ts

Mọi error từ Axios/native được đưa qua đây.

Chuẩn hóa:

OFFLINE_BEFORE_SEND
TIMEOUT
NETWORK_FAILURE
SERVER_ERROR
AUTH_ERROR
CLIENT_ERROR
ABORTED
UNKNOWN

Có thể mở rộng:

RATE_LIMITED
NOT_FOUND
CONFLICT
VALIDATION_ERROR

Object lỗi nên có dạng logic:

type
statusCode
retryable
retryAfter
axiosCode
message
originalError

Quan trọng: technical type và UI message không nên là một thứ.

Ví dụ:

TIMEOUT

ở Product:

Đang kết nối lại...

nhưng ở Payment:

Không thể xác định trạng thái thanh toán.

Cùng một technical error nhưng UX khác nhau.

8. Bỏ kiểu xử lý lỗi phân tán

Hiện tại nếu có:

if (error.message === 'Network Error')

ở nhiều file thì phải refactor dần về:

Axios
↓
ErrorClassifier
↓
NormalizedError
↓
Store / Hook / UI

Screen không được phụ thuộc vào Axios error string.

9. Refactor API Client

apiClient.ts giữ:

baseURL
headers
timeout
auth interceptor
refresh token
failedQueue
request cancellation
error normalization

Nhưng không được để API Client điều khiển toàn bộ NetworkManager.

API Client không làm:

"Offline thì giữ Promise"

Không.

HTTP request phải có lifecycle hữu hạn.

REQUEST
↓
SUCCESS
hoặc
FAIL
hoặc
ABORT
10. Timeout

Giữ timeout hiện tại:

10000ms

nếu audit cho thấy nó phù hợp.

Nhưng timeout phải được hiểu là:

Request không hoàn thành trong giới hạn.

Nó không phải:

Internet chắc chắn đã mất.

Vì vậy:

TIMEOUT ≠ OFFLINE

và ErrorClassifier phải phân biệt chúng.

11. Network Guard

Có thể có pre-flight guard:

NetworkManager.status === OFFLINE

thì những request mà rõ ràng không nên gửi có thể fail ngay với:

OFFLINE_BEFORE_SEND

Nhưng đây chỉ là optimization và UX, không phải guarantee.

Vì:

ONLINE
↓
check network
↓
100ms
↓
network chết
↓
request vẫn fail

Do đó API Client vẫn phải xử lý network error bình thường.

12. Request Context

Đây là phần rất quan trọng.

Mỗi request quan trọng nên có metadata:

operationType
retryable
idempotent
operationId
maxRetries

Ví dụ GET Product:

operationType = READ_PRODUCT
retryable = true
idempotent = true

Booking:

operationType = CREATE_BOOKING
retryable = false
idempotent = false
operationId = UUID

Payment:

operationType = PAYMENT
retryable = false
idempotent = false
operationId = UUID

Điều này tốt hơn việc hard-code:

GET = retry
POST = no retry
13. P0 — Double Submit Protection

Đối với:

Booking
Checkout
Order
Payment

state:

IDLE
↓
SUBMITTING
↓
SUCCESS
FAILED
UNKNOWN

Khi:

SUBMITTING

button phải disabled.

Ví dụ user:

click 1
click 2
click 3

chỉ request đầu tiên được nhận.

Nhưng phải chú ý:

isSubmitting không phải Idempotency.

Nó chỉ bảo vệ khỏi double-click trong client.

14. OperationId

Với Mobile hiện tại có thể tạo:

operationId = UUID

nhưng phải hiểu chính xác:

Hiện tại đây chỉ là local operation identifier.

Backend không hiểu nó.

Do đó nó có thể dùng để:

tracking
logging
local state machine
debugging
future backend integration

nhưng không được tuyên bố nó chống duplicate ở server.

Quan trọng nhất:

Operation
   ↓
operationId = A
   ↓
Attempt #1
   ↓
Attempt #2

Nếu có attempt thứ hai thì operationId vẫn là A.

Không generate ID mới cho cùng business intent.

15. OFFLINE_BEFORE_SEND

Nếu user bấm:

Đặt lịch

và NetworkManager đang báo offline:

OFFLINE_BEFORE_SEND

thì:

không gửi POST
không khóa business state
không reset cart
không tạo UNKNOWN

UI báo:

Vui lòng kiểm tra kết nối Internet rồi thử lại.

Đây là trường hợp biết chắc request chưa được attempt.

16. UNKNOWN

Đây là phần phải cực kỳ cẩn thận.

Nếu:

POST Booking
↓
request đã bắt đầu
↓
timeout

thì không được tự kết luận:

FAILED

vì có thể:

Mobile → Server
             ↓
         xử lý thành công
             ↓
         response mất
             ↓
Mobile timeout

Khi đó:

UNKNOWN

Có nghĩa:

Mobile không biết server đã xử lý operation hay chưa.

17. Vì Backend chưa có Status API

Không được làm:

UNKNOWN
↓
GET /status/{operationId}

vì API đó chưa tồn tại.

Thay vào đó:

UNKNOWN
↓
KHÔNG AUTO RETRY
↓
KHÔNG XÓA CART
↓
KHÔNG RESET BUSINESS OPERATION
↓
Hiển thị cảnh báo
↓
Hướng user kiểm tra lịch sử

Ví dụ:

Kết nối bị gián đoạn nên chưa thể xác định trạng thái đơn hàng. Vui lòng kiểm tra Lịch sử đơn hàng trước khi thực hiện lại để tránh tạo đơn trùng.

Đây là fallback UX, không phải transaction verification.

18. Không dùng getBookingHistory như Check Status

Nếu mobile gọi:

getBookingHistory()

thì chỉ được gọi đây là:

History-based fallback

Không được gọi là:

Transaction status verification

vì:

history
≠
operation status

Dữ liệu lịch sử có thể:

chưa cập nhật
phân trang
cache
nhiều đơn cùng thời điểm
khó xác định record tương ứng
19. Không auto-retry mutation quan trọng

Với Backend hiện tại:

POST booking
POST order
POST checkout
POST payment

mặc định:

AUTO RETRY = NO

đặc biệt đối với:

TIMEOUT
NETWORK_FAILURE

Vì mobile không biết attempt trước có được server xử lý hay chưa.

Đây là quyết định an toàn hơn retry mù.

20. P1 — GET Retry

Sau khi P0 ổn định mới triển khai GET recovery.

Tạo:

src/network/retryPolicy.ts

Policy:

retryable = true
maxRetries = 3

Retry khi phù hợp:

NETWORK_FAILURE
TIMEOUT
502
503
504

Không retry:

400
401
403
404
422

429 nên xử lý theo policy riêng, ưu tiên Retry-After nếu server trả về.

21. Exponential Backoff + Jitter

Ví dụ:

attempt #1
≈ 500ms + jitter


attempt #2
≈ 1000ms + jitter


attempt #3
≈ 2000ms + jitter

Không retry vô hạn.

Không:

500ms
500ms
500ms
500ms
...

vì khi server/network gặp vấn đề lớn sẽ tạo request storm.

22. Network-Aware Recovery

Không nên:

offline
↓
retry 500ms
↓
retry 1s
↓
retry 2s

khi thiết bị đang offline rõ ràng.

Thay vào đó:

GET attempt
↓
network failure
↓
request kết thúc
↓
NetworkManager = OFFLINE
↓
đợi ONLINE
↓
Recovery
↓
GET attempt mới

Không giữ Axios Promise sống để “chờ mạng”.

23. Request Cancellation

Đối với GET:

Product A
↓
GET A
↓
user back
↓
Abort A
↓
Product B
↓
GET B

Dùng AbortController.

Nhưng AbortController không đủ.

24. Stale Response Guard

Mỗi request cần một identifier/version:

requestId = 1

Nếu user tạo request mới:

requestId = 2

Response cũ:

response.requestId = 1
currentRequestId = 2

thì:

1 !== 2
→ discard response
→ không setState

Đây là lớp bảo vệ thứ hai sau AbortController.

25. P1 — Foreground Revalidation

Dùng:

AppState

Khi:

background
↓
foreground

thì:

check network
↓
xác định resource stale
↓
refetch resource cần thiết

Không:

foreground
↓
refetch toàn bộ API

Resource nào stale mới refetch.

26. Cache / Graceful Degradation

Không cần migrate TanStack Query ngay.

Zustand có thể giữ dữ liệu hiện tại cho:

products
services
salon information

Flow:

cache
↓
render ngay
↓
background refetch
↓
server response
↓
update Zustand

Offline:

cache còn
↓
user vẫn xem được

Nhưng:

booking slot
inventory
payment status

không được coi cache là source of truth.

Server vẫn quyết định.

27. UI Error State

Hiện tại:

API error
↓
ErrorState full screen

nên thay bằng hai loại.

Temporary Recovery
network failure
↓
retry/recovery

→ giữ UI hiện tại
→ hiển thị banner nhỏ
→ tự recovery.

Hard Failure
retry hết
hoặc business error

→ ErrorState
→ nút Retry thủ công.

Như vậy việc mất mạng 2 giây không làm user bị đá ra khỏi màn hình.

28. Auth Refresh

Giữ nguyên failedQueue.

Không rewrite nếu hiện tại nó đang hoạt động.

Flow:

Request A → 401
Request B → 401
Request C → 401
        ↓
   Refresh token 1 lần
        ↓
      failedQueue
        ↓
Replay A/B/C

Không để:

A → refresh
B → refresh
C → refresh

Đồng thời refresh endpoint phải tránh vòng lặp refresh chính nó.

29. Những thứ TUYỆT ĐỐI không làm trong Phase này

Không thêm vì “production”:

Offline Queue cho Booking
Offline Queue cho Order
Offline Queue cho Payment
WebSocket
Optimistic Booking
Optimistic Payment
TanStack Query migration toàn bộ

Production không có nghĩa là nhét mọi pattern vào app.

30. Backend Future Contract

Đây là Phase riêng, không gộp vào Mobile P0.

Khi backend team sẵn sàng, bổ sung:

Idempotency-Key
OperationId persistence
Duplicate detection
Operation status

Flow sau này:

POST
Idempotency-Key = ABC
↓
Backend process
↓
lưu result

Request lại:

POST
Idempotency-Key = ABC
↓
Backend nhận ra đã xử lý
↓
trả kết quả cũ

Và:

UNKNOWN
↓
GET status ABC
↓
PENDING / SUCCESS / FAILED

Khi đó Mobile mới có thể thực sự hoàn thiện business-level recovery.

31. Roadmap chính thức
P0 — Bắt buộc
1. Audit code hiện tại
2. NetInfo
3. NetworkManager
4. ONLINE/OFFLINE/RECONNECTING
5. Global NetworkBanner
6. ErrorClassifier
7. API Client normalization
8. Preserve token refresh queue
9. Network guard
10. Double-submit protection
11. Local OperationId
12. UNKNOWN state
13. AbortController
14. Stale-response guard
P1 — Recovery
1. Request context
2. RetryPolicy
3. GET retry
4. Exponential backoff
5. Jitter
6. Network-aware recovery
7. Foreground revalidation
8. GET cache
9. Graceful degradation
P2 — Future
1. Backend Idempotency-Key
2. Backend Operation Status
3. Mobile UNKNOWN status resolution
4. Safe retry mutation
5. TanStack Query nếu complexity tăng
32. Acceptance Criteria

AI/developer không được kết thúc implementation chỉ vì app compile được.

Phải test các case sau.

Test 1 — Offline trước request
Wi-Fi OFF
↓
GET Product

Kết quả:

Không request vô ích
Không crash
Offline UI
Test 2 — Wi-Fi → 4G
GET Product
↓
Wi-Fi OFF
↓
4G ON

Kết quả:

request cũ kết thúc
network recovery
GET attempt mới
SUCCESS
Test 3 — Network chập chờn
GET
↓
fail
↓
online
↓
retry

Không được retry vô hạn.

Test 4 — Stale response
GET A
↓
GET B
↓
B trả trước
↓
A trả sau

State cuối:

B

không phải A.

Test 5 — Double click
Tap Payment × 5

Kết quả:

1 business submission
Test 6 — Offline Payment
Offline
↓
Tap Payment

Kết quả:

OFFLINE_BEFORE_SEND
Không POST
Test 7 — Payment timeout
POST payment
↓
timeout

Kết quả:

UNKNOWN
Không auto retry
Không auto clear cart
Không tự báo FAILED
Test 8 — 401 concurrent
A → 401
B → 401
C → 401

Kết quả:

1 refresh
3 requests chờ
Test 9 — Background → foreground
Background
↓
network change
↓
Foreground

Kết quả:

network re-evaluate
stale data refetch
Test 10 — Server 500

GET:

500
↓
retry policy

POST payment:

500
↓
KHÔNG retry mù
33. Definition of Done

Implementation chỉ được coi là hoàn thành khi:

✅ NetInfo hoạt động global
✅ Không có duplicate network listeners
✅ Error handling được centralized
✅ Không còn screen tự check "Network Error"
✅ GET recovery hoạt động
✅ Retry có giới hạn
✅ Backoff + jitter hoạt động
✅ Offline không tạo request GET vô ích
✅ AbortController hoạt động
✅ Stale response không ghi đè state
✅ Double-submit bị chặn
✅ Timeout mutation không tự thành FAILED
✅ Không auto-retry booking/order/payment
✅ Token refresh race vẫn được bảo vệ
✅ Foreground revalidation hoạt động
✅ Existing Zustand architecture không bị phá
✅ Existing API contract không bị thay đổi
✅ Backend không cần sửa để P0/P1 hoạt động
34. Kiến trúc cuối cùng sau khi hoàn thành

LGHair sẽ chuyển từ:

USER
 ↓
SCREEN
 ↓
API
 ↓
FAIL
 ↓
ERROR SCREEN
 ↓
USER RETRY

thành:

                         NETWORK MANAGER
                               │
                  ONLINE / OFFLINE / RECONNECTING
                               │
                               ▼
UI
↓
ZUSTAND / HOOK
↓
SERVICE
↓
API CLIENT
↓
REQUEST CONTEXT
↓
ERROR CLASSIFIER
↓
┌──────────────────────────────────────────────┐
│                                              │
│ READ                         MUTATION        │
│                                              │
│ retryable                    no blind retry  │
│ backoff                      double-submit   │
│ jitter                       operationId     │
│ cache                        UNKNOWN         │
│ recovery                     user fallback   │
│                                              │
└──────────────────────────────────────────────┘