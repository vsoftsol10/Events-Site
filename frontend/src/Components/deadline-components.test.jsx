// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ language: "en", get: vi.fn(), post: vi.fn(), put: vi.fn(), navigate: vi.fn() }));

vi.mock("axios", () => ({ default: { get: mocks.get, post: mocks.post, put: mocks.put } }));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate, useParams: () => ({ id: "mock-event" }) }));
vi.mock("react-i18next", () => ({
  useTranslation: () => {
    const t = (key) => ({
      registerNow: "Register Now", registertoday: "Register Today",
      registrationClosed: mocks.language === "ta" ? "பதிவு முடிவடைந்தது" : "Registration Closed",
      registrationClosedMessage: mocks.language === "ta"
        ? "இந்த நிகழ்விற்கான பதிவு தற்போது மூடப்பட்டுள்ளது."
        : "Registration for this event is now closed.",
      registrationCloses: "Registration Closes In", days: "DAYS", hours: "HOURS", mins: "MINS", secs: "SECS",
    }[key] || key);
    return { i18n: { language: mocks.language, t, changeLanguage: (language) => { mocks.language = language; } }, t };
  },
}));
vi.mock("framer-motion", async () => {
  const ReactModule = await import("react");
  const motion = new Proxy({}, {
    get: (_target, tag) => ReactModule.forwardRef((componentProps, ref) => {
      const { children, ...props } = componentProps;
      const motionOnly = new Set(["whileHover", "whileTap", "animate", "initial", "exit", "variants", "transition", "viewport", "whileInView", "layoutId"]);
      const domProps = Object.fromEntries(Object.entries(props).filter(([key]) => !motionOnly.has(key)));
      return ReactModule.createElement(tag, { ...domProps, ref }, children);
    }),
  });
  return { motion, AnimatePresence: ({ children }) => children };
});

import Hero from "./Hero.jsx";
import CTA from "./CTA.jsx";
import Nav from "./Nav.jsx";
import RegistrationPage from "./RegistrationPage.jsx";
import EditEvent from "../Pages/EditEvent.jsx";
import Events from "../Pages/Events.jsx";

function eventRows(deadline, status = "published") {
  const row = Array(19).fill("");
  row[0] = "mock-event";
  row[1] = "Women Entrepreneurs Networking Meetup";
  row[2] = "பெண்கள் தொழில்முனைவோர் சந்திப்பு";
  row[3] = "Offline";
  row[4] = "2026-10-10";
  row[5] = "16:30 - 18:30";
  row[6] = "Tirunelveli";
  row[7] = "திருநெல்வேலி";
  row[8] = "20";
  row[9] = "Tirunelveli";
  row[10] = deadline;
  row[11] = "Networking event";
  row[12] = "நிகழ்வு";
  row[13] = "[]";
  row[14] = "[]";
  row[15] = status;
  row[18] = "0";
  return [row];
}

async function flushEffects() {
  await act(async () => { vi.advanceTimersByTime(0); await Promise.resolve(); await Promise.resolve(); });
}

describe("deadline-aware registration components", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse("2026-10-11T18:28:59Z"));
    mocks.language = "en";
    window.alert = vi.fn();
    mocks.navigate.mockReset();
    mocks.post.mockReset();
    mocks.put.mockReset();
    mocks.put.mockResolvedValue({ data: {} });
    mocks.get.mockImplementation((url) => Promise.resolve({
      data: url.includes("payment-settings") ? {} : url.includes("/registrations") ? [] : eventRows("2026-10-11"),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("Hero reaches zero, closes without refresh, has one interval, and removes it on unmount", async () => {
    const view = render(<Hero />);
    await flushEffects();
    expect(screen.getByText(/Registration Closes In/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Register Now/ }).disabled).toBe(false);
    expect(vi.getTimerCount()).toBe(1);

    await act(async () => { vi.advanceTimersByTime(1000); });
    const seconds = screen.getByText("SECS").parentElement.querySelectorAll("span");
    expect(seconds.length).toBe(1);

    await act(async () => { vi.advanceTimersByTime(59000); });
    expect(screen.getByRole("button", { name: "Registration Closed" }).disabled).toBe(true);
    for (const unit of ["DAYS", "HOURS", "MINS", "SECS"]) {
      const values = screen.getByText(unit).parentElement.querySelectorAll("span");
      expect(values.length).toBe(1);
      expect(values[0].textContent).toBe("00");
    }
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("Nav desktop and mobile buttons close after the same deadline", async () => {
    const view = render(<Nav />);
    await flushEffects();
    const desktop = screen.getByRole("button", { name: /Register Now/ });
    expect(desktop.disabled).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    const registerButtons = screen.getAllByRole("button", { name: /Register Now/ });
    expect(registerButtons.length).toBe(2);
    await act(async () => { vi.advanceTimersByTime(60000); });
    expect(screen.getAllByRole("button", { name: "Registration Closed" }).every((button) => button.disabled)).toBe(true);
    mocks.language = "ta";
    view.rerender(<Nav />);
    expect(screen.getAllByRole("button", { name: "பதிவு முடிவடைந்தது" }).every((button) => button.disabled)).toBe(true);
  });

  it("CTA closes after expiry", async () => {
    const view = render(<CTA />);
    await flushEffects();
    expect(screen.getByRole("button", { name: /Register Today/ }).disabled).toBe(false);
    await act(async () => { vi.advanceTimersByTime(60000); });
    expect(screen.getByRole("button", { name: "Registration Closed" }).disabled).toBe(true);
    mocks.language = "ta";
    view.rerender(<CTA />);
    expect(screen.getByRole("button", { name: "பதிவு முடிவடைந்தது" }).disabled).toBe(true);
  });

  it("RegistrationPage replaces the form with English and Tamil closed messaging", async () => {
    const view = render(<RegistrationPage />);
    await flushEffects();
    expect(screen.getByText("Register for the Event")).toBeTruthy();
    await act(async () => { vi.advanceTimersByTime(60000); });
    expect(screen.getByRole("heading", { name: "Registration Closed" })).toBeTruthy();
    expect(screen.queryByText("Register for the Event")).toBeNull();
    view.rerender(<RegistrationPage />);
    mocks.language = "ta";
    view.rerender(<RegistrationPage />);
    expect(screen.getByRole("heading", { name: "பதிவு முடிவடைந்தது" })).toBeTruthy();
  });

  it("blocks a payment submission if its deadline passes immediately beforehand", async () => {
    mocks.get.mockImplementation((url) => Promise.resolve({
      data: url.includes("payment-settings") ? {} : eventRows("2026-10-11T18:30:00+05:30"),
    }));
    vi.setSystemTime(Date.parse("2026-10-11T12:59:00Z"));
    render(<RegistrationPage />);
    await flushEffects();
    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Test User" } });
    fireEvent.change(inputs[1], { target: { value: "9876543210" } });
    fireEvent.change(inputs[2], { target: { value: "test@example.com" } });
    fireEvent.change(inputs[3], { target: { value: "Test Business" } });
    fireEvent.change(document.querySelector("select"), { target: { value: "Other" } });
    fireEvent.change(inputs[5], { target: { value: "Tirunelveli" } });
    window.alert = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: "Continue to Payment" }));
    expect(screen.getByRole("button", { name: "Confirm Registration" })).toBeTruthy();
    vi.setSystemTime(Date.parse("2026-10-11T13:00:00Z"));
    window.alert = vi.fn();
    fireEvent.click(screen.getByRole("button", { name: "Confirm Registration" }));
    expect(mocks.post).not.toHaveBeenCalled();
    expect(window.alert).not.toHaveBeenCalled();
  });

  it("admin Events honors date-only end-of-day IST before auto-closing", async () => {
    vi.setSystemTime(Date.parse("2026-10-11T18:29:58Z"));
    const view = render(<Events />);
    await flushEffects();
    expect(mocks.put).not.toHaveBeenCalled();
    view.unmount();

    vi.setSystemTime(Date.parse("2026-10-11T18:30:00Z"));
    render(<Events />);
    await flushEffects();
    expect(mocks.put).toHaveBeenCalledWith(expect.stringContaining("/events/mock-event/status"), { status: "closed" });
  });

  it("EditEvent loads a legacy date-only deadline with time 23:59", async () => {
    render(<EditEvent />);
    await flushEffects();
    const timeInputs = document.querySelectorAll('input[type="time"]');
    expect(timeInputs[1].value).toBe("23:59");
  });
});
