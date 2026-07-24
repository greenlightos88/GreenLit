import { afterEach, describe, expect, mock, test } from "bun:test";
import { useEffect } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ProvisioningGate } from "../src/auth/ProvisioningGate";
import { BootSplash } from "../src/auth/BootSplash";

afterEach(cleanup);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

describe("ProvisioningGate", () => {
  test("calls bootstrap once and does not mount children until it resolves", async () => {
    const d = deferred<void>();
    const bootstrap = mock(() => d.promise);
    const onMount = mock(() => {});
    function Workspace() {
      useEffect(() => {
        onMount();
      }, []);
      return <div>WORKSPACE</div>;
    }

    render(
      <ProvisioningGate bootstrap={bootstrap} signOut={<span>out</span>}>
        <Workspace />
      </ProvisioningGate>,
    );

    // Exactly one bootstrap call, and no protected child mounted yet.
    expect(bootstrap).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("WORKSPACE")).toBeNull();
    expect(onMount).not.toHaveBeenCalled();

    d.resolve();
    await screen.findByText("WORKSPACE");
    expect(onMount).toHaveBeenCalledTimes(1);
    expect(bootstrap).toHaveBeenCalledTimes(1);
  });

  test("renders retry and sign-out on failure and never mounts the workspace", async () => {
    const bootstrap = mock(() => Promise.reject(new Error("boom")));
    render(
      <ProvisioningGate
        bootstrap={bootstrap}
        signOut={<button type="button">Sign out</button>}
      >
        <div>WORKSPACE</div>
      </ProvisioningGate>,
    );
    await screen.findByText(/setup could not complete/i);
    expect(screen.getByText("Retry")).toBeDefined();
    expect(screen.getByText("Sign out")).toBeDefined();
    expect(screen.queryByText("WORKSPACE")).toBeNull();
  });

  test("retry re-invokes bootstrap and mounts the workspace on success", async () => {
    let calls = 0;
    const bootstrap = mock(() => {
      calls += 1;
      return calls === 1 ? Promise.reject(new Error("boom")) : Promise.resolve();
    });
    render(
      <ProvisioningGate
        bootstrap={bootstrap}
        signOut={<button type="button">Sign out</button>}
      >
        <div>WORKSPACE</div>
      </ProvisioningGate>,
    );
    await screen.findByText("Retry");
    fireEvent.click(screen.getByText("Retry"));
    await screen.findByText("WORKSPACE");
    expect(bootstrap).toHaveBeenCalledTimes(2);
  });
});

describe("BootSplash", () => {
  test("renders the loading message", () => {
    render(<BootSplash />);
    expect(screen.getByText(/loading your workspace/i)).toBeDefined();
  });
});
