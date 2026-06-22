"use client";

type Props = {
    version: string;
    title: string;
    description: string;
    url: string;
    force: boolean;
};

export default function UpdateDialog(props: Props) {
    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.4)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    background: "white",
                    padding: 30,
                    borderRadius: 12,
                    width: 420,
                }}
            >
                <h2>{props.title}</h2>

                <p>{props.description}</p>

                <p>
                    Version mới: <b>{props.version}</b>
                </p>

                <button
                    onClick={() => window.open(props.url)}
                >
                    Tải ngay
                </button>

                {!props.force && (
                    <button
                        onClick={() => location.reload()}
                    >
                        Để sau
                    </button>
                )}
            </div>
        </div>
    );
}