"use client";
import Logo from "@/assets/svg/Logo";

export default function MacbookIntro() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="relative macbook-wrapper">
        <div className="macbook">
          <div className="inner">
            <div className="screen">
              <div className="face-one">
                <div className="camera"></div>
                <div className="display">
                  <div className="shade"></div>
                </div>
                <span>A L G O</span>
              </div>
              <Logo className="logo" />
            </div>
            <div className="body">
              <div className="face-one">
                <div className="touchpad"></div>
                <div className="keyboard">
                  {Array.from({ length: 80 }).map((_, i) => (
                    <div
                      key={i}
                      className={`key${i === 5 ? " space" : ""}${
                        i >= 60 ? " f" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="pad one"></div>
              <div className="pad two"></div>
              <div className="pad three"></div>
              <div className="pad four"></div>
            </div>
          </div>
          <div className="shadow"></div>
        </div>
      </div>
    </div>
  );
}
