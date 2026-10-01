namespace Challenges.BinaryHeap;

public class MinHeap
{
    private int[] _a = new int[16];
    private int _n;

    public int Count => _n;

    public void Push(int x)
    {
        if (_n == _a.Length) Array.Resize(ref _a, _n * 2);
        var i = _n++;
        _a[i] = x;
        while (i > 0 && _a[(i - 1) / 2] > _a[i]) // parent bigger: rule broken, swap up
        {
            (_a[i], _a[(i - 1) / 2]) = (_a[(i - 1) / 2], _a[i]);
            i = (i - 1) / 2;
        }
    }

    public int Peek() => _n > 0 ? _a[0] : throw new InvalidOperationException("Heap is empty");

    public int Pop()
    {
        var top = Peek();
        _a[0] = _a[--_n]; // last item fills the hole so the tree stays complete
        var i = 0;
        while (true)
        {
            int l = 2 * i + 1, r = l + 1, small = i;
            if (l < _n && _a[l] < _a[small]) small = l;
            if (r < _n && _a[r] < _a[small]) small = r;
            if (small == i) break;
            (_a[i], _a[small]) = (_a[small], _a[i]); // sift down towards the smaller child
            i = small;
        }
        return top;
    }

    public static List<int> SmallestK(IEnumerable<int> stream, int k)
    {
        var maxHeap = new MinHeap(); // store negatives: the root is then the LARGEST value kept
        foreach (var x in stream)
        {
            if (maxHeap.Count < k) maxHeap.Push(-x);
            else if (k > 0 && x < -maxHeap.Peek())
            {
                maxHeap.Pop(); // drop the largest of the k, keep x instead
                maxHeap.Push(-x);
            }
        }
        var outp = new List<int>();
        while (maxHeap.Count > 0) outp.Add(-maxHeap.Pop());
        outp.Reverse();
        return outp;
    }
}
