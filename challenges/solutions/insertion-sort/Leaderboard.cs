namespace Challenges.InsertionSort;

public class Leaderboard
{
    private readonly List<int> _scores = new(); // kept sorted, highest first

    public void Add(int score)
    {
        _scores.Add(score);
        var i = _scores.Count - 1;
        while (i > 0 && _scores[i - 1] < score)
        {
            _scores[i] = _scores[i - 1]; // shift the smaller score one place right
            i--;
        }
        _scores[i] = score;
    }

    public List<int> Top(int k) => _scores.Take(k).ToList();

    public static void InsertionSort(int[] a)
    {
        for (var i = 1; i < a.Length; i++)
        {
            var key = a[i];
            var j = i - 1;
            while (j >= 0 && a[j] > key)
            {
                a[j + 1] = a[j];
                j--;
            }
            a[j + 1] = key;
        }
    }
}
