# Go Import Paths

The Go packages use simplified import paths for better developer experience.

## Package Import Paths

### Core Package
```go
import "github.com/openlibx402/go/openlibx402-core"
```

### Client Package
```go
import "github.com/openlibx402/go/openlibx402-client"
```

### net/http Middleware
```go
import nethttp "github.com/openlibx402/go/openlibx402-nethttp"
```

### Echo Middleware
```go
import echox402 "github.com/openlibx402/go/openlibx402-echo"
```

## Installation

```bash
# Core package
go get github.com/openlibx402/go/openlibx402-core

# Client package
go get github.com/openlibx402/go/openlibx402-client

# net/http middleware
go get github.com/openlibx402/go/openlibx402-nethttp

# Echo middleware
go get github.com/openlibx402/go/openlibx402-echo
```

## Example Usage

### Server with net/http

```go
package main

import (
    "encoding/json"
    "net/http"

    nethttp "github.com/openlibx402/go/openlibx402-nethttp"
)

func main() {
    nethttp.InitX402(&nethttp.Config{
        PaymentAddress: "YOUR_WALLET_ADDRESS",
        TokenMint:      "USDC_MINT_ADDRESS",
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    http.Handle("/premium", nethttp.PaymentRequired(nethttp.PaymentRequiredOptions{
        Amount: "0.10",
    })(handler))

    http.ListenAndServe(":8080", nil)
}
```

### Server with Echo

```go
package main

import (
    "net/http"

    "github.com/labstack/echo/v4"
    echox402 "github.com/openlibx402/go/openlibx402-echo"
)

func main() {
    echox402.InitX402(&echox402.Config{
        PaymentAddress: "YOUR_WALLET_ADDRESS",
        TokenMint:      "USDC_MINT_ADDRESS",
        Network:        "solana-devnet",
        AutoVerify:     true,
    })

    e := echo.New()

    e.GET("/premium", handler, echox402.PaymentRequired(echox402.PaymentRequiredOptions{
        Amount: "0.10",
    }))

    e.Start(":8080")
}
```

### Auto Client

```go
package main

import (
    "context"
    "io"
    "log"

    "github.com/gagliardetto/solana-go"
    "github.com/openlibx402/go/openlibx402-client"
)

func main() {
    keypair := loadKeypair()

    client := client.NewAutoClient(keypair, "", &client.AutoClientOptions{
        MaxPaymentAmount: "10.0",
        AutoRetry:        true,
    })
    defer client.Close()

    resp, err := client.Get(context.Background(), "https://api.example.com/premium")
    if err != nil {
        log.Fatal(err)
    }
    defer resp.Body.Close()

    data, _ := io.ReadAll(resp.Body)
    log.Println(string(data))
}
```

### Explicit Client

```go
package main

import (
    "context"
    "io"
    "log"

    "github.com/gagliardetto/solana-go"
    "github.com/openlibx402/go/openlibx402-client"
)

func main() {
    keypair := loadKeypair()

    client := client.NewX402Client(keypair, "", nil, false)
    defer client.Close()

    ctx := context.Background()

    resp, err := client.Get(ctx, "https://api.example.com/premium", nil)
    if err != nil {
        log.Fatal(err)
    }

    if client.PaymentRequired(resp) {
        paymentReq, err := client.ParsePaymentRequest(resp)
        if err != nil {
            log.Fatal(err)
        }

        auth, err := client.CreatePayment(ctx, paymentReq, "")
        if err != nil {
            log.Fatal(err)
        }

        resp, err = client.Get(ctx, "https://api.example.com/premium", auth)
        if err != nil {
            log.Fatal(err)
        }
    }

    data, _ := io.ReadAll(resp.Body)
    resp.Body.Close()
    log.Println(string(data))
}
```

## Repository Structure

The packages are located in the monorepo at:

```
packages/go/
├── openlibx402-core/       # github.com/openlibx402/go/openlibx402-core
├── openlibx402-client/     # github.com/openlibx402/go/openlibx402-client
├── openlibx402-nethttp/    # github.com/openlibx402/go/openlibx402-nethttp
└── openlibx402-echo/       # github.com/openlibx402/go/openlibx402-echo
```

## Publishing

When publishing to GitHub, the packages will be available at:

- `github.com/openlibx402/go/openlibx402-core`
- `github.com/openlibx402/go/openlibx402-client`
- `github.com/openlibx402/go/openlibx402-nethttp`
- `github.com/openlibx402/go/openlibx402-echo`

Users can install them directly with `go get`.

## Local Development

For local development, the examples use `replace` directives in their `go.mod` files:

```go
replace (
    github.com/openlibx402/go/openlibx402-client => ../../../packages/go/openlibx402-client
    github.com/openlibx402/go/openlibx402-core => ../../../packages/go/openlibx402-core
    github.com/openlibx402/go/openlibx402-nethttp => ../../../packages/go/openlibx402-nethttp
    github.com/openlibx402/go/openlibx402-echo => ../../../packages/go/openlibx402-echo
)
```

This allows working with local packages during development while maintaining the published import paths.
